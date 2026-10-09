const mongoose = require("mongoose");
const DamageRecord = require("../models/DamageRecord");
const Return = require("../models/Return");
const Rental = require("../models/Rental");
const Equipment = require("../models/Equipment");

const Notification = require("../models/notification");
const User = require("../models/User");


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

     const equipment = await Equipment.findById(equipmentId);

     if (!equipment) {
       return res.status(404).json({
         success: false,
         message: "Equipment not found",
       });
     }

     const blocked =
       equipment.status === "DAMAGED" ||
       equipment.status === "MAINTENANCE";

     const overdueRental = await Rental.findOne({
       equipment: equipmentId,
       status: "ACTIVE",
       endDate: { $lt: new Date() },
     }).select("_id");

     const unavailableRentals = await Rental.find({
       equipment: equipmentId,
       status: {
         $in: ["PENDING", "CONFIRMED", "ACTIVE"],
       },
       endDate: { $gt: new Date() },
     })
       .select("startDate endDate")
       .sort({ startDate: 1 })
       .lean();

     const unavailablePeriods = unavailableRentals.map(
       (rental) => ({
         startDate: rental.startDate,
         endDate: rental.endDate,
       })
     );

     const isBlocked = blocked || Boolean(overdueRental);

     return res.status(200).json({
       success: true,
       data: {
         equipmentId,
         blocked: isBlocked,
         message: blocked
           ? "Equipment is currently unavailable due to damage or maintenance."
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

    validId(equipmentId, "equipment");

    if (typeof startDate !== "string" || typeof endDate !== "string") {
      fail(400, "Please provide valid rental start and end dates");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid rental start and end dates",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const sriLankaDateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const getSriLankaDateKey = (date) => {
      const parts = sriLankaDateFormatter.formatToParts(date);
      const value = (type) =>
        parts.find((part) => part.type === type).value;

      return `${value("year")}-${value("month")}-${value("day")}`;
    };

    if (getSriLankaDateKey(start) < getSriLankaDateKey(new Date())) {
      return res.status(400).json({
        success: false,
        message: "Rental start date cannot be in the past",
      });
    }

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
      startDate: { $lt: end },
      endDate: { $gt: start },
    });

    if (conflictingRental) {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Equipment is not available for the selected dates",
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      message: "Equipment is available for the selected dates",
    });
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

    validId(equipmentId, "equipment");

    if (typeof startDate !== "string" || typeof endDate !== "string") {
      fail(400, "Please provide valid rental start and end dates");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      fail(400, "Please provide valid rental start and end dates");
    }

    if (start >= end) {
      fail(400, "End date must be after start date");
    }

    const sriLankaDateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const getSriLankaDateKey = (date) => {
      const parts = sriLankaDateFormatter.formatToParts(date);
      const value = (type) =>
        parts.find((part) => part.type === type).value;

      return `${value("year")}-${value("month")}-${value("day")}`;
    };

    if (getSriLankaDateKey(start) < getSriLankaDateKey(new Date())) {
      fail(400, "Rental start date cannot be in the past");
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
        startDate: { $lt: end },
        endDate: { $gt: start },
      }).session(session);

      if (conflictingRental) {
        fail(409, "Equipment is already booked for the selected dates");
      }

      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      const numberOfDays = Math.ceil((end - start) / millisecondsPerDay);
      const totalPrice = numberOfDays * equipment.rentalPricePerDay;

      if (!Number.isFinite(totalPrice) || totalPrice < 0) {
        fail(400, "Equipment rental price is invalid");
      }

      const [createdRental] = await Rental.create(
        [
          {
            customer: req.user.userId,
            equipment: equipmentId,
            startDate: start,
            endDate: end,
            totalPrice,
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
          startDate: { $lt: rental.endDate },
          endDate: { $gt: rental.startDate },
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

      if (!damageRecord) {
        fail(404, "Damage record not found");
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

      damageRecord.status = status;

      if (cost !== undefined) {
        damageRecord.repairCost = cost;
      }

      damageRecord.resolvedAt =
        status === "RESOLVED"
          ? damageRecord.resolvedAt || new Date()
          : null;

      await damageRecord.save({ session });

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
        damageRecord,
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

    const filter = { _id: req.params.id };

    const rental = await Rental.findOneAndUpdate(
      { ...filter, status: "RETURNED" },
      { $set: { status: "COMPLETED" } },
      { new: true, runValidators: true }
    );

    if (!rental) {
      if (!(await Rental.exists(filter))) {
        fail(404, "Rental not found");
      }

      fail(400, "Only returned rentals can be completed");
    }


    // ============================================================
    // NOTIFY CUSTOMER AFTER SUCCESSFUL RENTAL COMPLETION
    // ============================================================

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
  cancelRental,
  completeRental,
};