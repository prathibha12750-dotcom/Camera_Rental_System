const mongoose = require("mongoose");

// Customer rental notifications from the integration branch.
const PhotographerNotification = require("../models/photographerNotification");

const DamageRecord = require("../models/DamageRecord");
const Return = require("../models/Return");
const Rental = require("../models/Rental");
const Equipment = require("../models/Equipment");
const Invoice = require("../models/invoice");
const Deposit = require("../models/deposit");

const Notification = require("../models/notification");
const User = require("../models/User");

const {
  isValidDateKey,
  getRentalStartDate,
  getRentalReturnDeadline,
  getColomboDateKey,
  getRentalDayCount,
} = require("../utils/rentalDates");

const {
  calculateOverduePenalty,
} = require("../utils/overduePenalty");

// ============================================================
// SHARED HELPERS
// ============================================================

const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isRentalError = true;
  throw error;
};

const validId = (id, label = "rental") => {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) {
    fail(400, `Invalid ${label} ID`);
  }
};

const handleError = (error, res, next) => {
  if (
    error.isRentalError ||
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(error.isRentalError ? error.statusCode : 400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This record already exists. Refresh and try again.",
    });
  }

  return next(error);
};

const inTransaction = async (work) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(() => work(session), {
      readPreference: "primary",
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });
  } finally {
    await session.endSession();
  }
};

const lockEquipment = async (id, session) => {
  const equipment = await Equipment.findOneAndUpdate(
    { _id: id },
    { $inc: { rentalScheduleVersion: 1 } },
    { new: true, session }
  );

  if (!equipment) {
    fail(404, "Equipment not found");
  }

  return equipment;
};

const optionalText = (value, label) => {
  if (value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    fail(400, `${label} must be text`);
  }

  const text = value.trim();

  if (text.length > 1000) {
    fail(400, `${label} cannot exceed 1000 characters`);
  }

  return text;
};


 // ============================================================
 // GET RENTAL CALENDAR - CUSTOMER
 // ============================================================

const getRentalCalendar = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;

    validId(equipmentId, "equipment");

    const equipment = await Equipment.findById(
      equipmentId
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    const now = new Date();

    // Equipment unavailable due to its condition.
    const conditionBlocked =
      equipment.status === "DAMAGED" ||
      equipment.status === "MAINTENANCE";

    // Equipment that has not been returned after
    // its agreed return deadline.
    const overdueRental = await Rental.findOne({
      equipment: equipmentId,
      status: "ACTIVE",
      endDate: { $lt: now },
    })
      .select("_id endDate")
      .lean();

    // Include all current and future reservations.
    // Also include overdue ACTIVE rentals, even if
    // their original return deadline has passed.
    const unavailableRentals = await Rental.find({
      equipment: equipmentId,
      status: {
        $in: ["PENDING", "CONFIRMED", "ACTIVE"],
      },
      $or: [
        { endDate: { $gt: now } },
        {
          status: "ACTIVE",
          endDate: { $lt: now },
        },
      ],
    })
      .select("startDate endDate status")
      .sort({ startDate: 1 })
      .lean();

    const unavailablePeriods = unavailableRentals.map(
      (rental) => ({
        startDate: rental.startDate,
        endDate: rental.endDate,
      })
    );

    const isBlocked =
      conditionBlocked || Boolean(overdueRental);

    return res.status(200).json({
      success: true,
      data: {
        equipmentId,
        blocked: isBlocked,
        message: conditionBlocked
          ? "Equipment is unavailable due to damage or maintenance."
          : overdueRental
            ? "Equipment has an overdue rental and cannot be booked until it is returned."
            : "",
        unavailablePeriods,
      },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

 
 // ============================================================
 // NOTIFY CLERK AND ADMIN ABOUT A NEW RENTAL REQUEST
 // ============================================================

 const notifyRentalRequest = async (rental) => {
   const staffUsers = await User.find({
     role: { $in: ["CLERK", "STAFF_ADMIN"] },
     status: "ACTIVE",
   }).select("_id");

   if (staffUsers.length === 0) {
     return;
   }

   const notifications = staffUsers.map((staff) => ({
     recipient: staff._id,
     title: "New Equipment Rental Request",
     message:
       "A customer has submitted a new equipment rental request. " +
       "Please review it in Rental Management.",
     type: "RENTAL_REQUEST",
     isRead: false,
   }));

   await Notification.insertMany(notifications);
 };


// ============================================================
// CHECK EQUIPMENT AVAILABILITY
// ============================================================

const checkAvailability = async (req, res, next) => {
  try {
    const { equipmentId, startDate, endDate } = req.body;

    if (!equipmentId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Equipment ID, start date and end date are required",
      });
    }

    // ==========================================
    // VALIDATE EQUIPMENT ID AND RENTAL DATES
    // ==========================================

    validId(equipmentId, "equipment");

    if (
      typeof startDate !== "string" ||
      typeof endDate !== "string"
    ) {
      fail(400, "Please provide valid rental start and end dates");
    }

    if (
      !isValidDateKey(startDate) ||
      !isValidDateKey(endDate)
    ) {
      fail(
        400,
        "Rental dates must be valid dates in YYYY-MM-DD format"
      );
    }

    // Rental starts at midnight in Sri Lanka.
    const start = getRentalStartDate(startDate);

    // Rental ends at 6:00 PM in Sri Lanka.
    const end = getRentalReturnDeadline(endDate);

    if (startDate >= endDate) {
      fail(400, "End date must be after start date");
    }

    if (startDate < getColomboDateKey(new Date())) {
      fail(400, "Rental start date cannot be in the past");
    }

    // ==========================================
    // CHECK EQUIPMENT AVAILABILITY
    // ==========================================

    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    if (
      equipment.status === "MAINTENANCE" ||
      equipment.status === "DAMAGED"
    ) {
      return res.status(400).json({
        success: false,
        message: `Equipment is currently ${equipment.status.toLowerCase()}`,
      });
    }

    const overdueRental = await Rental.findOne({
      equipment: equipmentId,
      status: "ACTIVE",
      endDate: { $lt: new Date() },
    });

    if (overdueRental) {
      return res.status(200).json({
        success: true,
        available: false,
        message:
          "Equipment is overdue and must be returned before another rental can be arranged",
      });
    }

    const conflictingRental = await Rental.findOne({
      equipment: equipmentId,
      status: {
        $in: ["PENDING", "CONFIRMED", "ACTIVE"],
      },

      // Existing rental starts on or before
      // the requested return date.
      startDate: { $lte: end },

      // Existing rental ends on or after
      // the requested start date.
      endDate: { $gte: start },
    });

    
  // ========================================
  // CURRENT PHYSICAL AVAILABILITY added by abilash
  // ========================================

  // Compare date-only rental starts using UTC,
  // consistent with our previous validation.
  const currentDate = new Date();
  currentDate.setUTCHours(0, 0, 0, 0);

  // Equipment still physically rented cannot be
  // requested for a rental starting today.
  if (
    equipment.status === "RENTED" &&
    start <= currentDate
  ) {
    return res.status(200).json({
      success: true,
      available: false,
      availabilityStatus: "RENTED",
      message:
        "Equipment is currently rented and has not been returned",
    });
  }
  //end

  //added by abilash
  if (conflictingRental) {
    let availabilityStatus = "UNAVAILABLE";
    let message =
      "Equipment is not available for the selected dates";

    if (conflictingRental.status === "PENDING") {
      availabilityStatus = "PENDING_REQUEST";
      message =
        "Equipment has a pending rental request for the selected dates";
    }

    if (conflictingRental.status === "CONFIRMED") {
      availabilityStatus = "RESERVED";
      message =
        "Equipment is reserved for the selected dates";
    }

    if (conflictingRental.status === "ACTIVE") {
      availabilityStatus = "RENTED";
      message =
        "Equipment is currently rented during the selected dates";
    }

    return res.status(200).json({
      success: true,
      available: false,
      availabilityStatus,
      message,
    });
  }

  return res.status(200).json({
    success: true,
    available: true,
    availabilityStatus: "AVAILABLE",
    message: "Equipment is available for the selected dates",
  });
  //end
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ============================================================
// CREATE RENTAL REQUEST - CUSTOMER
// ============================================================

const createRentalRequest = async (req, res, next) => {
  try {
    if (req.user?.role !== "CUSTOMER") {
      fail(403, "Only customers can submit rental requests");
    }

    const { equipmentId, startDate, endDate } = req.body;

    if (!equipmentId || !startDate || !endDate) {
      fail(400, "Equipment ID, start date and end date are required");
    }

    // ==========================================
    // VALIDATE RENTAL EQUIPMENT AND DATES
    // ==========================================

    validId(equipmentId, "equipment");

    if (
      typeof startDate !== "string" ||
      typeof endDate !== "string"
    ) {
      fail(400, "Please provide valid rental start and end dates");
    }

    if (
      !isValidDateKey(startDate) ||
      !isValidDateKey(endDate)
    ) {
      fail(
        400,
        "Rental dates must be valid dates in YYYY-MM-DD format"
      );
    }

    // Start at midnight on the selected date
    // in Sri Lanka.
    const start = getRentalStartDate(startDate);

    // Return deadline: 6:00 PM Sri Lanka time
    // on the selected end date.
    const end = getRentalReturnDeadline(endDate);

    // The end calendar date must be later
    // than the start calendar date.
    if (startDate >= endDate) {
      fail(400, "End date must be after start date");
    }

    // Reject rental requests starting in the past.
    if (startDate < getColomboDateKey(new Date())) {
      fail(400, "Rental start date cannot be in the past");
    }

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      fail(400, "Please provide valid rental start and end dates");
    }

    if (start >= end) {
      fail(400, "End date must be after start date");
    }

    const rental = await inTransaction(async (session) => {
      const equipment = await lockEquipment(equipmentId, session);

      if (
        equipment.status === "MAINTENANCE" ||
        equipment.status === "DAMAGED"
      ) {
        fail(400, "Equipment is currently unavailable");
      }

      const overdueRental = await Rental.findOne({
        equipment: equipmentId,
        status: "ACTIVE",
        endDate: { $lt: new Date() },
      }).session(session);

      if (overdueRental) {
        fail(
          409,
          "Equipment is overdue and must be returned before another rental can be arranged"
        );
      }

      const conflictingRental = await Rental.findOne({
        equipment: equipmentId,
        status: {
          $in: ["PENDING", "CONFIRMED", "ACTIVE"],
        },

        startDate: { $lte: end },
        endDate: { $gte: start },
      }).session(session);

      if (conflictingRental) {
        fail(409, "Equipment is already booked for the selected dates");
      }

      // Calculate rental duration from the selected
      // calendar dates, not elapsed hours.
      //
      // Example: October 21 to October 22 = 1 day.
      const numberOfDays = getRentalDayCount(
        startDate,
        endDate
      );

      // ==========================================
      // SNAPSHOT SECURITY DEPOSIT AT BOOKING
      // ==========================================

      const securityDeposit = Number(
        equipment.securityDeposit ?? 0
      );

      if (
        !Number.isFinite(securityDeposit) ||
        securityDeposit < 0
      ) {
        fail(400, "Equipment security deposit is invalid");
      }

      const dailyRentalPrice = Number(equipment.rentalPricePerDay);

      if (
        !Number.isFinite(dailyRentalPrice) ||
        dailyRentalPrice < 0
      ) {
        fail(400, "Equipment rental price is invalid");
      }

      const totalPrice = numberOfDays * dailyRentalPrice;

      if (!Number.isFinite(totalPrice) || totalPrice < 0) {
        fail(400, "Equipment rental price is invalid");
      }

      // ==========================================
      // SNAPSHOT OVERDUE PENALTY POLICY
      // ==========================================

      // Equipment with no explicit rate uses the
      // confirmed default policy of 20%.
      const overduePenaltyRate =
        equipment.overduePenaltyRate == null
          ? 20
          : Number(equipment.overduePenaltyRate);

      if (
        !Number.isFinite(overduePenaltyRate) ||
        overduePenaltyRate < 0 ||
        overduePenaltyRate > 100
      ) {
        fail(400, "Equipment overdue penalty rate is invalid");
      }

      // Round to two decimal places for currency.
      const overduePenaltyPerDay = Math.round(
        (dailyRentalPrice * overduePenaltyRate / 100) * 100
      ) / 100;

      if (
        !Number.isFinite(overduePenaltyPerDay) ||
        overduePenaltyPerDay < 0
      ) {
        fail(400, "Calculated overdue penalty is invalid");
      }

      // ==========================================
      // CREATE RENTAL WITH AGREED PENALTY POLICY
      // ==========================================

      const [createdRental] = await Rental.create(
        [
          {
            customer: req.user.userId,
            equipment: equipmentId,
            startDate: start,
            endDate: end,
            totalPrice,
            securityDeposit,
            
            overduePenaltyRate,
            overduePenaltyPerDay,

            overdueDays: 0,
            overduePenaltyAmount: 0,
            overduePenaltyStatus: "NOT_APPLICABLE",

            status: "PENDING",
          },
        ],
        { session }
      );

      return createdRental;
    });


    // Create in-app notifications after the rental
    // transaction has completed successfully.
    try {
      await notifyRentalRequest(rental);
    } catch (notificationError) {
      // Notification failure must not undo a successful rental.
      console.error(
        "Failed to create rental request notifications:",
        notificationError
      );
    }

    // Notify the customer after successful rental creation.
    try {
      await PhotographerNotification.create({
        user: rental.customer,
        type: "RENTAL_REQUEST_CONFIRMED",
        title: "Rental Request Received",
        message:
          "Your equipment rental request has been received " +
          "successfully and is awaiting approval.",
        rental: rental._id,
        read: false,
      });
    } catch (notificationError) {
      console.error(
        "Failed to create customer rental confirmation notification:",
        notificationError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Rental request created successfully",
      data: { rental },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ============================================================
// GET ALL RENTALS - ADMIN / CLERK
// ============================================================

const getAllRentals = async (req, res, next) => {
  try {
    const rentals = await Rental.find()
      .populate("customer", "name email")
      .populate(
        "equipment",
        "name brand model serialNumber rentalPricePerDay status"
      )
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Find invoices associated with the loaded rentals.
    const rentalIds = rentals.map((rental) => rental._id);

    const invoices = await Invoice.find({
      rental: { $in: rentalIds },
    })
      .select(
        "rental invoiceNumber totalAmount paymentStatus"
      )
      .lean();
          
      const invoiceIds = invoices.map((invoice) => invoice._id);

      const deposits = await Deposit.find({
        invoice: { $in: invoiceIds },
      })
        .select("invoice status")
        .lean();

      const depositMap = new Map(
        deposits.map((deposit) => [
          String(deposit.invoice),
          deposit,
        ])
      );

    // Create an invoice lookup for efficient matching.
    const invoiceMap = new Map(
      invoices.map((invoice) => [
        String(invoice.rental),
        invoice,
      ])
    );

    // Attach invoice details to each rental.
    const calculationTime = new Date();

    const rentalsWithInvoices = rentals.map((rental) => {
      const invoice = invoiceMap.get(String(rental._id));

      // Calculate an estimated penalty for active rentals.
      // Returned rentals use their actual return timestamp.
      const overdueEstimate = calculateOverduePenalty(
        rental,
        calculationTime
      );

      const deposit = invoice
        ? depositMap.get(String(invoice._id))
        : null;

        return {
          ...rental,

          // Read-only overdue penalty estimate.
          // No charge or deposit deduction occurs here.
          overdueEstimate,

          invoice: invoice

          ? {
              _id: invoice._id,
              invoiceNumber: invoice.invoiceNumber,
              totalAmount: invoice.totalAmount,
              paymentStatus: invoice.paymentStatus,
            }
          : null,

        depositStatus: deposit?.status || null,

        depositSettled: Boolean(
          invoice?.paymentStatus === "PAID" &&
          deposit &&
          [
            "REFUNDED",
            "PARTIALLY_REFUNDED",
            "DEDUCTED",
          ].includes(deposit.status)
        ),
      };
    });

    return res.status(200).json({
      success: true,
      count: rentalsWithInvoices.length,
      data: {
        rentals: rentalsWithInvoices,
      },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ============================================================
// APPROVE RENTAL - ADMIN / CLERK
// ============================================================

const approveRental = async (req, res, next) => {
  let session;

  const approvalError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isRentalApprovalError = true;
    return error;
  };

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID",
      });
    }

    session = await mongoose.startSession();

    const approvedRental = await session.withTransaction(
      async () => {
        const rental = await Rental.findById(req.params.id).session(session);

        if (!rental) {
          throw approvalError(404, "Rental not found");
        }

        if (rental.status !== "PENDING") {
          throw approvalError(
            400,
            "Only pending rental requests can be approved"
          );
        }

        // A shared equipment write coordinates concurrent approvals.
        const equipment = await Equipment.findOneAndUpdate(
          { _id: rental.equipment },
          { $inc: { rentalScheduleVersion: 1 } },
          { new: true, session }
        );

        if (!equipment) {
          throw approvalError(404, "Equipment not found");
        }

        if (
          equipment.status === "DAMAGED" ||
          equipment.status === "MAINTENANCE"
        ) {
          throw approvalError(
            409,
            "Rental cannot be approved because the equipment is damaged or under maintenance."
          );
        }

        const overdueRental = await Rental.findOne({
          _id: { $ne: rental._id },
          equipment: rental.equipment,
          status: "ACTIVE",
          endDate: { $lt: new Date() },
        }).session(session);

        if (overdueRental) {
          throw approvalError(
            409,
            "Rental cannot be approved because this equipment is overdue. Record its return first."
          );
        }

        const conflictingRental = await Rental.findOne({
          _id: { $ne: rental._id },
          equipment: rental.equipment,
          status: {
            $in: ["CONFIRMED", "ACTIVE"],
          },
          startDate: { $lte: rental.endDate },
          endDate: { $gte: rental.startDate },
        }).session(session);

        if (conflictingRental) {
          throw approvalError(
            409,
            "Rental cannot be approved because the equipment is already booked for these dates"
          );
        }

        const updatedRental = await Rental.findOneAndUpdate(
          {
            _id: rental._id,
            status: "PENDING",
          },
          {
            $set: {
              status: "CONFIRMED",
              approvedBy: req.user.userId,
              approvedAt: new Date(),
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          }
        );

        if (!updatedRental) {
          throw approvalError(
            409,
            "Rental status changed. Refresh the rental list and try again."
          );
        }

        // ============================================================
        // AUTOMATICALLY GENERATE RENTAL INVOICE
        // ============================================================

        // Check whether an invoice already exists for this rental.
        const existingInvoice = await Invoice.findOne({
          rental: updatedRental._id,
        }).session(session);

        if (!existingInvoice) {
          const serviceAmount = Number(updatedRental.totalPrice);    
          const securityDeposit = Number(updatedRental.securityDeposit ??equipment.securityDeposit ??0);

          // Validate invoice amounts.
          if (
            !Number.isFinite(serviceAmount) ||
            serviceAmount < 0 ||
            !Number.isFinite(securityDeposit) ||
            securityDeposit < 0
          ) {
            throw approvalError(
              400,
              "Invalid rental price or security deposit. Invoice cannot be generated."
            );
          }

          // Generate a unique invoice number.
          const invoiceNumber =
            `INV-${Date.now()}-${updatedRental._id.toString().slice(-6)}`;

          // Create invoice inside the existing transaction.
          await Invoice.create(
            [
              {
                invoiceNumber,
                customer: updatedRental.customer,
                rental: updatedRental._id,
                booking: null,
                serviceDetails:
                  `Equipment rental: ${equipment.name} (${equipment.model})`,
                serviceAmount,
                securityDeposit,
                totalAmount: serviceAmount + securityDeposit,
                paymentStatus: "PENDING",
              },
            ],
            { session }
          );
        }

        return updatedRental;
      },
      {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      }
    );


    // ============================================================
    // NOTIFY CUSTOMER AFTER SUCCESSFUL RENTAL APPROVAL
    // ============================================================

    try {
      await Notification.create({
        recipient: approvedRental.customer,
        title: "Rental Request Approved",
        message:
          "Your equipment rental request has been approved. " +
          "Please check My Rentals for details.",
        type: "RENTAL_APPROVED",
        isRead: false,
      });
    } catch (notificationError) {
      // Do not fail an already successful rental approval.
      console.error(
        "Failed to create rental approval notification:",
        notificationError
      );
    }

    return res.status(200).json({
      success: true,
      message: "Rental approved successfully",
      data: { rental: approvedRental },
    });

  } catch (error) {
    if (error.isRentalApprovalError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

 // ============================================================
 // REJECT RENTAL - ADMIN / CLERK
 // ============================================================

 const rejectRental = async (req, res, next) => {
   try {
     validId(req.params.id);

     const filter = { _id: req.params.id };

     const rental = await Rental.findOneAndUpdate(
       { ...filter, status: "PENDING" },
       { $set: { status: "REJECTED" } },
       { new: true, runValidators: true }
     );

     if (!rental) {
       if (!(await Rental.exists(filter))) {
         fail(404, "Rental not found");
       }

       fail(400, "Only pending rental requests can be rejected");
     }

     // ============================================================
     // NOTIFY CUSTOMER AFTER SUCCESSFUL RENTAL REJECTION
     // ============================================================

     try {
       await Notification.create({
         recipient: rental.customer,
         title: "Rental Request Rejected",
         message:
           "Your equipment rental request has been rejected. " +
           "Please check My Rentals for details.",
         type: "RENTAL_REJECTED",
         isRead: false,
       });
     } catch (notificationError) {
       // A notification failure must not undo a successful rejection.
       console.error(
         "Failed to create rental rejection notification:",
         notificationError
       );
     }

     return res.status(200).json({
       success: true,
       message: "Rental rejected successfully",
       data: { rental },
     });
   } catch (error) {
     return handleError(error, res, next);
   }
 };

// ============================================================
// ISSUE EQUIPMENT - ADMIN / CLERK
// ============================================================

const issueRental = async (req, res, next) => {
  let session;

  const issueError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isRentalIssueError = true;
    return error;
  };

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID",
      });
    }

    session = await mongoose.startSession();

    const result = await session.withTransaction(
      async () => {
        const rental = await Rental.findById(req.params.id).session(session);

        if (!rental) {
          throw issueError(404, "Rental not found");
        }

        if (rental.status !== "CONFIRMED") {
          throw issueError(400, "Only confirmed rentals can be issued");
        }


        // ============================================================
        // VERIFY RENTAL INVOICE PAYMENT BEFORE EQUIPMENT ISSUE
        // ============================================================

        const invoice = await Invoice.findOne({
          rental: rental._id,
          customer: rental.customer,
        }).session(session);

        if (!invoice) {
          throw issueError(
            400,
            "Equipment cannot be issued because the rental invoice was not found."
          );
        }

        if (invoice.paymentStatus !== "PAID") {
          throw issueError(
            409,
            "Equipment cannot be issued until the rental invoice is fully paid and the payment is verified."
          );
        }


        const equipment = await Equipment.findOneAndUpdate(
          { _id: rental.equipment },
          { $inc: { rentalScheduleVersion: 1 } },
          { new: true, session }
        );

        if (!equipment) {
          throw issueError(404, "Equipment not found");
        }

        if (
          equipment.status === "MAINTENANCE" ||
          equipment.status === "DAMAGED"
        ) {
          throw issueError(
            400,
            `Equipment cannot be issued because it is ${equipment.status.toLowerCase()}`
          );
        }

        if (equipment.status === "RENTED") {
          throw issueError(
            409,
            "This equipment is already issued to another customer. Record its return before issuing it again."
          );
        }

        const activeRental = await Rental.findOne({
          equipment: rental.equipment,
          status: "ACTIVE",
        }).session(session);

        if (activeRental) {
          throw issueError(
            409,
            "This equipment has an active rental. Record its return before issuing it again."
          );
        }

        const updatedRental = await Rental.findOneAndUpdate(
          {
            _id: rental._id,
            status: "CONFIRMED",
          },
          {
            $set: {
              status: "ACTIVE",
              issuedAt: new Date(),
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          }
        );

        if (!updatedRental) {
          throw issueError(
            409,
            "Rental status changed. Refresh the rental list and try again."
          );
        }

        equipment.status = "RENTED";
        await equipment.save({ session });

        return {
          rental: updatedRental,
          equipment,
        };
      },
      {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      }
    );

    // ============================================================
    // NOTIFY CUSTOMER AFTER SUCCESSFUL EQUIPMENT ISSUE
    // ============================================================

    try {
      await Notification.create({
        recipient: result.rental.customer,
        title: "Equipment Issued Successfully",
        message:
          "Your rented equipment has been issued successfully. " +
          "Please check My Rentals for details.",
        type: "RENTAL_ISSUED",
        isRead: false,
      });
    } catch (notificationError) {
      console.error(
        "Failed to create equipment issued notification:",
        notificationError
      );
    }

    return res.status(200).json({
      success: true,
      message: "Equipment issued successfully",
      data: result,
    });
  } catch (error) {
    if (error.isRentalIssueError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// ============================================================
// RETURN EQUIPMENT - ADMIN / CLERK
// ============================================================

const returnRental = async (req, res, next) => {
  try {
    validId(req.params.id);

    const { condition, damageDescription, notes } = req.body;

    if (!condition) {
      fail(400, "Return condition is required");
    }

    if (!["EXCELLENT", "GOOD", "FAIR", "DAMAGED"].includes(condition)) {
      fail(400, "Invalid return condition");
    }

    const description = optionalText(
      damageDescription,
      "Damage description"
    );
    const cleanNotes = optionalText(notes, "Notes");

    if (condition === "DAMAGED" && !description) {
      fail(
        400,
        "Damage description is required for damaged equipment"
      );
    }

    const result = await inTransaction(async (session) => {
      const rental = await Rental.findById(req.params.id).session(session);

      if (!rental) {
        fail(404, "Rental not found");
      }

      if (rental.status !== "ACTIVE") {
        fail(400, "Only active rentals can be returned");
      }

      const equipment = await lockEquipment(rental.equipment, session);

      const existingReturn = await Return.exists({
        rental: rental._id,
      }).session(session);

      if (existingReturn) {
        fail(409, "A return has already been recorded for this rental");
      }

      const otherActiveRental = await Rental.exists({
        _id: { $ne: rental._id },
        equipment: rental.equipment,
        status: "ACTIVE",
      }).session(session);

      if (otherActiveRental) {
        fail(
          409,
          "Multiple active rentals exist for this equipment. Correct the rental records before recording its return."
        );
      }

      const returnedAt = new Date();

      // ==========================================
      // CALCULATE FINAL OVERDUE PENALTY
      // ==========================================

      // Use the actual physical return time.
      // This freezes the penalty calculation.
      const finalOverduePenalty = calculateOverduePenalty(
        rental,
        returnedAt
      );

      const [returnRecord] = await Return.create(
        [
          {
            rental: rental._id,
            equipment: equipment._id,
            customer: rental.customer,
            returnedAt,
            condition,
            damageDescription: description,
            notes: cleanNotes,
            receivedBy: req.user.userId,
          },
        ],
        { session }
      );

      let damageRecord = null;

      if (condition === "DAMAGED") {
        [damageRecord] = await DamageRecord.create(
          [
            {
              rental: rental._id,
              equipment: equipment._id,
              customer: rental.customer,
              returnRecord: returnRecord._id,
              description,
              reportedBy: req.user.userId,
            },
          ],
          { session }
        );
      }

      rental.status = "RETURNED";
      rental.returnedAt = returnedAt;

      // Freeze the overdue amount at physical return.
      rental.overdueDays = finalOverduePenalty.overdueDays;
      rental.overduePenaltyAmount =
        finalOverduePenalty.overduePenaltyAmount;

      if (finalOverduePenalty.applicable) {
        // The penalty must be reviewed by Clerk/Admin.
        // No deduction is made automatically.
        rental.overduePenaltyStatus = "PENDING_REVIEW";
        rental.overduePenaltyReviewedBy = null;
        rental.overduePenaltyReviewedAt = null;
        rental.overduePenaltyReviewNotes = "";
      } else {
        rental.overduePenaltyStatus = "NOT_APPLICABLE";
      }

      await rental.save({ session });

      equipment.condition = condition;

      const openMaintenance = await DamageRecord.exists({
        equipment: equipment._id,
        status: "MAINTENANCE",
      }).session(session);

      const openDamage = await DamageRecord.exists({
        equipment: equipment._id,
        status: { $ne: "RESOLVED" },
      }).session(session);

      equipment.status = openMaintenance
        ? "MAINTENANCE"
        : openDamage
          ? "DAMAGED"
          : "AVAILABLE";

      if (openDamage) {
        equipment.condition = "DAMAGED";
      }

      await equipment.save({ session });

      return {
        rental,
        equipment,
        returnRecord,
        damageRecord,
      };
    });


    // ============================================================
    // NOTIFY CUSTOMER AFTER SUCCESSFUL EQUIPMENT RETURN
    // ============================================================

    try {
      await Notification.create({
        recipient: result.rental.customer,
        title: "Equipment Return Recorded",
        message:
          "Your equipment return has been recorded successfully. " +
          "Please check My Rentals for details.",
        type: "RENTAL_RETURNED",
        isRead: false,
      });
    } catch (notificationError) {
      console.error(
        "Failed to create equipment return notification:",
        notificationError
      );
    }


    return res.status(200).json({
      success: true,
      message: "Equipment returned successfully",
      data: result,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ============================================================
// GET ALL DAMAGE RECORDS - ADMIN / CLERK
// ============================================================

const getAllDamageRecords = async (req, res, next) => {
  try {
    const damageRecords = await DamageRecord.find()
      .populate("customer", "name email")
      .populate(
        "equipment",
        "name brand model serialNumber condition status"
      )
      .populate("reportedBy", "name email")
      .populate("returnRecord")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: damageRecords.length,
      data: { damageRecords },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ============================================================
// UPDATE DAMAGE RECORD STATUS - ADMIN / CLERK
// ============================================================

const updateDamageRecordStatus = async (req, res, next) => {
  try {
    validId(req.params.id, "damage record");

    const { status, repairCost } = req.body;

    const allowedStatuses = [
      "REPORTED",
      "UNDER_INSPECTION",
      "MAINTENANCE",
      "RESOLVED",
    ];

    if (!allowedStatuses.includes(status)) {
      fail(400, "Invalid damage record status");
    }

    let cost;

    if (repairCost !== undefined) {
      if (
        (typeof repairCost !== "number" &&
          typeof repairCost !== "string") ||
        String(repairCost).trim() === ""
      ) {
        fail(400, "Repair cost must be a non-negative number");
      }

      cost = Number(repairCost);

      if (!Number.isFinite(cost) || cost < 0) {
        fail(400, "Repair cost must be a non-negative number");
      }
    }

    const result = await inTransaction(async (session) => {
      const damageRecord = await DamageRecord.findById(
        req.params.id
      ).session(session);
     
        // ==========================================
        // VALIDATE DAMAGE RECORD EXISTS
        // ==========================================

        if (!damageRecord) {
          fail(404, "Damage record not found");
        }

        // ==========================================
        // PROTECT REVIEWED DAMAGE DEDUCTIONS
        // ==========================================

        if (
          ["APPROVED", "REJECTED"].includes(
            damageRecord.deductionApprovalStatus
          )
        ) {
          fail(
            409,
            "This damage deduction has already been reviewed. Its repair cost and status cannot be modified."
          );
        }

      // ==========================================
      // COORDINATE WITH DEPOSIT SETTLEMENT
      // ==========================================

      const rentalInvoice = await Invoice.findOne({
        rental: damageRecord.rental,
      }).session(session);

      if (rentalInvoice) {
        const settlementDeposit = await Deposit.findOne({
          invoice: rentalInvoice._id,
        }).session(session);

        if (settlementDeposit) {
          if (
            [
              "REFUND_PENDING",
              "REFUNDED",
              "PARTIALLY_REFUNDED",
              "DEDUCTED",
            ].includes(settlementDeposit.status)
          ) {
            fail(
              409,
              "Damage records cannot be modified after deposit settlement begins."
            );
          }

          if (settlementDeposit.status === "HELD") {
            const depositLock = await Deposit.findOneAndUpdate(
              {
                _id: settlementDeposit._id,
                status: "HELD",
              },
              {
                $inc: {
                  settlementVersion: 1,
                },
              },
              {
                new: true,
                runValidators: true,
                session,
              }
            );

            if (!depositLock) {
              fail(
                409,
                "Deposit settlement changed. Refresh and try again."
              );
            }
          }
        }
      }

      const equipment = await lockEquipment(
        damageRecord.equipment,
        session
      );

      const activeRental = await Rental.exists({
        equipment: equipment._id,
        status: "ACTIVE",
      }).session(session);

      if (activeRental && status !== "RESOLVED") {
        fail(
          409,
          "Equipment has an active rental. Record its return before reopening damage handling."
        );
      }

      const previouslyResolved = damageRecord.status === "RESOLVED";


        // ==========================================
        // ATOMIC DAMAGE RECORD UPDATE
        // ==========================================

        const updatedDamageRecord =
          await DamageRecord.findOneAndUpdate(
            {
              _id: damageRecord._id,
              deductionApprovalStatus: "PENDING",
            },
            {
              $set: {
                status,
                repairCost:
                  cost !== undefined
                    ? cost
                    : damageRecord.repairCost,
                resolvedAt:
                  status === "RESOLVED"
                    ? damageRecord.resolvedAt || new Date()
                    : null,
              },
            },
            {
              new: true,
              runValidators: true,
              session,
            }
          );

        if (!updatedDamageRecord) {
          fail(
            409,
            "Damage deduction has already been reviewed. Refresh and try again."
          );
        }

      const maintenance = await DamageRecord.exists({
        equipment: equipment._id,
        status: "MAINTENANCE",
      }).session(session);

      const unresolved = await DamageRecord.exists({
        equipment: equipment._id,
        status: { $ne: "RESOLVED" },
      }).session(session);

      if (activeRental) {
        // Editing an old resolved record must not release issued equipment.
        equipment.status = "RENTED";
      } else if (unresolved) {
        equipment.status = maintenance ? "MAINTENANCE" : "DAMAGED";
        equipment.condition = "DAMAGED";
      } else if (!previouslyResolved) {
        equipment.status = "AVAILABLE";
        equipment.condition = "GOOD";
      }

      await equipment.save({ session });

      return {
        damageRecord: updatedDamageRecord,
        equipment,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Damage record updated successfully",
      data: result,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ============================================================
// GET OVERDUE RENTALS - ADMIN / CLERK
// ============================================================

const getOverdueRentals = async (req, res, next) => {
  try {
    const now = new Date();

    const rentals = await Rental.find({
      status: "ACTIVE",
      endDate: { $lt: now },
    })
      .populate("customer", "name email")
      .populate(
        "equipment",
        "name brand model serialNumber rentalPricePerDay"
      )
      .sort({ endDate: 1 });

    const overdueRentals = rentals.map((rental) => {
      const millisecondsOverdue = now - rental.endDate;

      const daysOverdue = Math.ceil(
        millisecondsOverdue / (1000 * 60 * 60 * 24)
      );

      return {
        ...rental.toObject(),
        daysOverdue,
      };
    });

    return res.status(200).json({
      success: true,
      count: overdueRentals.length,
      data: { rentals: overdueRentals },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ============================================================
// GET MY RENTALS - CUSTOMER
// ============================================================

const getMyRentals = async (req, res, next) => {
  try {
    if (req.user?.role !== "CUSTOMER") {
      fail(403, "Only customers can view their rental history");
    }

    const rentals = await Rental.find({
      customer: req.user.userId,
    })
      .populate(
        "equipment",
        "name brand model serialNumber rentalPricePerDay status condition"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rentals.length,
      data: { rentals },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};


 // ============================================================
 // GET SINGLE RENTAL DETAILS - CUSTOMER
 // ============================================================

const getMyRentalById = async (req, res, next) => {
  try {
    if (req.user?.role !== "CUSTOMER") {
      fail(403, "Only customers can view rental details");
    }

    validId(req.params.id);

    // Restrict the query to the authenticated customer.
    const rental = await Rental.findOne({
      _id: req.params.id,
      customer: req.user.userId,
    })
      .populate(
        "equipment",
        "name brand model serialNumber rentalPricePerDay status condition"
      )
      .lean();

    if (!rental) {
      fail(404, "Rental not found");
    }

    // Find the invoice linked to this specific rental.
    const invoice = await Invoice.findOne({
      rental: rental._id,
      customer: req.user.userId,
    })
      .select(
        "invoiceNumber serviceAmount securityDeposit totalAmount paymentStatus"
      )
      .lean();

    // Retrieve deposit information only through the
    // customer's verified rental invoice.
    let deposit = null;

    if (invoice) {
      deposit = await Deposit.findOne({
        invoice: invoice._id,
      })
        .select(
          "amount status deductedAmount refundedAmount settledAt"
        )
        .lean();
    }

    // ==========================================
    // CUSTOMER DEPOSIT DEDUCTION BREAKDOWN
    // ==========================================

    // Only include approved damage deductions
    // belonging to this customer's rental.
    const approvedDamageRecords = await DamageRecord.find({
      rental: rental._id,
      customer: req.user.userId,
      deductionApprovalStatus: "APPROVED",
    })
      .select("approvedDeductionAmount")
      .lean();

    const approvedDamageDeduction = approvedDamageRecords.reduce(
      (total, damage) =>
        total + Number(damage.approvedDeductionAmount || 0),
      0
    );

    // ==========================================
    // ALLOCATE ACTUAL DEPOSIT DEDUCTIONS
    // ==========================================

    const totalDepositDeduction = Math.max(
      0,
      Number(deposit?.deductedAmount || 0)
    );

    // Damage charges are recovered first.
    const damageDeductedFromDeposit = Math.min(
      approvedDamageDeduction,
      totalDepositDeduction
    );

    // Overdue penalties are recovered after damage.
    const overdueDeductedFromDeposit = Math.max(
      0,
      totalDepositDeduction - damageDeductedFromDeposit
    );

    const approvedOverduePenalty = [
      "APPROVED",
      "SETTLED",
    ].includes(rental.overduePenaltyStatus)
      ? Number(rental.overduePenaltyAmount || 0)
      : 0;

    const overduePenaltyRecovered = Math.min(
      overdueDeductedFromDeposit,
      approvedOverduePenalty
    );

    const deductionBreakdown = {
      approvedDamageDeduction,
      approvedOverduePenalty,
      damageRecovered: damageDeductedFromDeposit,
      overduePenaltyRecovered,
      totalDeductedFromDeposit: totalDepositDeduction,
      overduePenaltyOutstanding: Math.max(
        0,
        approvedOverduePenalty - overduePenaltyRecovered
      ),
    };


    return res.status(200).json({
      success: true,
      data: {
        rental,
        invoice,
        deposit,
        deductionBreakdown,
      },
    });

  } catch (error) {
    return handleError(error, res, next);
  }
};

// ============================================================
// CANCEL RENTAL - CUSTOMER
// ============================================================

const cancelRental = async (req, res, next) => {
  try {
    validId(req.params.id);

    if (req.user?.role !== "CUSTOMER") {
      fail(403, "Only customers can cancel rental requests");
    }

    const filter = {
      _id: req.params.id,
      customer: req.user.userId,
    };

    const rental = await Rental.findOneAndUpdate(
      { ...filter, status: "PENDING" },
      { $set: { status: "CANCELLED" } },
      { new: true, runValidators: true }
    );

    if (!rental) {
      if (!(await Rental.exists(filter))) {
        fail(404, "Rental not found");
      }

      fail(400, "Only pending rental requests can be cancelled");
    }


    // ============================================================
    // NOTIFY CLERK AND ADMIN AFTER SUCCESSFUL RENTAL CANCELLATION
    // ============================================================

    try {
      const staffUsers = await User.find({
        role: { $in: ["CLERK", "STAFF_ADMIN"] },
        status: "ACTIVE",
      }).select("_id");

      if (staffUsers.length > 0) {
        const notifications = staffUsers.map((staff) => ({
          recipient: staff._id,
          title: "Equipment Rental Cancelled",
          message:
            "A customer has cancelled an equipment rental request. " +
            "Please check Rental Management for details.",
          type: "RENTAL_CANCELLED",
          isRead: false,
        }));

        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      console.error(
        "Failed to create rental cancellation notifications:",
        notificationError
      );
    }


    return res.status(200).json({
      success: true,
      message: "Rental cancelled successfully",
      data: { rental },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};


 // ============================================================
 // COMPLETE RENTAL - ADMIN / CLERK
 // ============================================================

 const completeRental = async (req, res, next) => {
   try {
     validId(req.params.id);

     const rental = await inTransaction(async (session) => {
       // ==========================================
       // VALIDATE RENTAL STATUS
       // ==========================================

       const existingRental = await Rental.findById(
         req.params.id
       ).session(session);

       if (!existingRental) {
         fail(404, "Rental not found");
       }

       if (existingRental.status !== "RETURNED") {
         fail(409, "Only returned rentals can be completed");
       }

       // ==========================================
       // VERIFY INVOICE
       // ==========================================

       const invoice = await Invoice.findOne({
         rental: existingRental._id,
       }).session(session);

       if (!invoice) {
         fail(409, "Rental invoice not found");
       }

       if (invoice.paymentStatus !== "PAID") {
         fail(
           409,
           "Rental invoice must be fully paid before completion"
         );
       }

       // ==========================================
       // VERIFY SECURITY DEPOSIT SETTLEMENT
       // ==========================================

       const deposit = await Deposit.findOne({
         invoice: invoice._id,
       }).session(session);

       if (!deposit) {
         fail(
           409,
           "Security deposit record not found. Rental cannot be completed."
         );
       }

       const settledStatuses = [
         "REFUNDED",
         "PARTIALLY_REFUNDED",
         "DEDUCTED",
       ];

       if (!settledStatuses.includes(deposit.status)) {
         fail(
           409,
           "Security deposit must be fully settled before completing the rental."
         );
       }

       // ==========================================
       // COORDINATE WITH DEPOSIT SETTLEMENT
       // ==========================================

       const settlementLock = await Deposit.findOneAndUpdate(
         {
           _id: deposit._id,
           status: { $in: settledStatuses },
         },
         {
           $inc: {
             settlementVersion: 1,
           },
         },
         {
           new: true,
           runValidators: true,
           session,
         }
       );

       if (!settlementLock) {
         fail(
           409,
           "Security deposit settlement changed. Refresh and try again."
         );
       }

       // ==========================================
       // COMPLETE RENTAL ATOMICALLY
       // ==========================================

       const completedRental = await Rental.findOneAndUpdate(
         {
           _id: existingRental._id,
           status: "RETURNED",
         },
         {
           $set: {
             status: "COMPLETED",
           },
         },
         {
           new: true,
           runValidators: true,
           session,
         }
       );

       if (!completedRental) {
         fail(
           409,
           "Rental status changed. Refresh and try again."
         );
       }

       return completedRental;
     });

     // ==========================================
     // NOTIFY CUSTOMER AFTER SUCCESSFUL COMMIT
     // ==========================================

     try {
       await Notification.create({
         recipient: rental.customer,
         title: "Equipment Rental Completed",
         message:
           "Your equipment rental has been completed successfully. " +
           "Thank you for choosing our service.",
         type: "RENTAL_COMPLETED",
         isRead: false,
       });
     } catch (notificationError) {
       console.error(
         "Failed to create rental completion notification:",
         notificationError
       );
     }

     return res.status(200).json({
       success: true,
       message: "Rental completed successfully",
       data: { rental },
     });
   } catch (error) {
     if (
       error.code === 112 ||
       error.codeName === "WriteConflict" ||
       error.hasErrorLabel?.("TransientTransactionError")
     ) {
       return res.status(409).json({
         success: false,
         message:
           "Rental or deposit was modified by another operation. Please refresh and try again.",
       });
     }

     return handleError(error, res, next);
   }
 };

const reviewOverduePenalty = async (req, res, next) => {
  try {
    validId(req.params.id);

    const { decision, notes } = req.body;

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      fail(400, "Decision must be APPROVED or REJECTED");
    }

    const reviewNotes = optionalText(
      notes,
      "Overdue penalty review notes"
    );

    const result = await inTransaction(async (session) => {
      const rental = await Rental.findById(
        req.params.id
      ).session(session);

      if (!rental) {
        fail(404, "Rental not found");
      }

      if (rental.status !== "RETURNED") {
        fail(
          409,
          "Overdue penalties can only be reviewed after equipment return"
        );
      }

      if (rental.overduePenaltyStatus !== "PENDING_REVIEW") {
        fail(
          409,
          "This overdue penalty is not pending review"
        );
      }

      const invoice = await Invoice.findOne({
        rental: rental._id,
      }).session(session);

      if (!invoice) {
        fail(
          409,
          "Rental invoice not found"
        );
      }

      // Coordinate penalty review with the existing
      // security deposit settlement process.
      const deposit = await Deposit.findOne({
        invoice: invoice._id,
      }).session(session);

      if (!deposit) {
        fail(
          409,
          "Security deposit record not found"
        );
      }

      if (deposit.status !== "HELD") {
        fail(
          409,
          "Overdue penalty review is only allowed while the security deposit is held and settlement has not started"
        );
      }

      // Lock the deposit to coordinate concurrent
      // review and settlement operations.
      const lockedDeposit = await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,
          status: "HELD",
          settlementVersion: deposit.settlementVersion,
        },
        {
          $inc: { settlementVersion: 1 },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!lockedDeposit) {
        fail(
          409,
          "Deposit settlement changed. Refresh and try again."
        );
      }

      const reviewedRental = await Rental.findOneAndUpdate(
        {
          _id: rental._id,
          status: "RETURNED",
          overduePenaltyStatus: "PENDING_REVIEW",
        },
        {
          $set: {
            overduePenaltyStatus: decision,
            overduePenaltyReviewedBy: req.user.userId,
            overduePenaltyReviewedAt: new Date(),
            overduePenaltyReviewNotes: reviewNotes,
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!reviewedRental) {
        fail(
          409,
          "Overdue penalty has already been reviewed. Refresh and try again."
        );
      }

      return reviewedRental;
    });

    return res.status(200).json({
      success: true,
      message:
        decision === "APPROVED"
          ? "Overdue penalty approved successfully"
          : "Overdue penalty rejected successfully",
      data: {
        rental: result,
      },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getRentalCalendar,
  checkAvailability,
  createRentalRequest,
  getAllRentals,
  approveRental,
  rejectRental,
  issueRental,
  returnRental,
  getAllDamageRecords,
  updateDamageRecordStatus,
  getOverdueRentals,
  getMyRentals,
  getMyRentalById,
  cancelRental,
  completeRental,
  reviewOverduePenalty,
};