const DamageRecord = require("../models/DamageRecord");
const Return = require("../models/Return");
const Rental = require("../models/Rental");
const Equipment = require("../models/Equipment");

// CHECK EQUIPMENT AVAILABILITY
const checkAvailability = async (req, res, next) => {
  try {
    const { equipmentId, startDate, endDate } = req.body;

    if (!equipmentId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Equipment ID, start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
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

    const conflictingRental = await Rental.findOne({
      equipment: equipmentId,

      status: {
        $in: ["PENDING", "CONFIRMED", "ACTIVE"],
      },

      startDate: {
        $lt: end,
      },

      endDate: {
        $gt: start,
      },
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
    next(error);
  }
};

const createRentalRequest = async (req, res, next) => {
  try {
    const { equipmentId, startDate, endDate } = req.body;

    if (!equipmentId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Equipment ID, start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
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
        message: "Equipment is currently unavailable",
      });
    }

    const conflictingRental = await Rental.findOne({
      equipment: equipmentId,
      status: {
        $in: ["PENDING", "CONFIRMED", "ACTIVE"],
      },
      startDate: {
        $lt: end,
      },
      endDate: {
        $gt: start,
      },
    });

    if (conflictingRental) {
      return res.status(409).json({
        success: false,
        message: "Equipment is already booked for the selected dates",
      });
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const numberOfDays = Math.ceil(
      (end - start) / millisecondsPerDay
    );

    const totalPrice =
      numberOfDays * equipment.rentalPricePerDay;

    const rental = await Rental.create({
      customer: req.user.userId,
      equipment: equipmentId,
      startDate: start,
      endDate: end,
      totalPrice,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Rental request created successfully",
      data: {
        rental,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =================================================================
// GET ALL RENTALS - ADMIN
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
      data: {
        rentals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================================



// =======================================================================
// APPROVE RENTAL - ADMIN
// =======================================================================

const approveRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    // Only pending rentals can be approved
    if (rental.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending rental requests can be approved",
      });
    }

    // Check whether another confirmed/active rental now conflicts
    const conflictingRental = await Rental.findOne({
      _id: { $ne: rental._id },
      equipment: rental.equipment,

      status: {
        $in: ["CONFIRMED", "ACTIVE"],
      },

      startDate: {
        $lt: rental.endDate,
      },

      endDate: {
        $gt: rental.startDate,
      },
    });

    if (conflictingRental) {
      return res.status(409).json({
        success: false,
        message:
          "Rental cannot be approved because the equipment is already booked for these dates",
      });
    }

    rental.status = "CONFIRMED";
    rental.approvedBy = req.user.userId;
    rental.approvedAt = new Date();

    await rental.save();

    return res.status(200).json({
      success: true,
      message: "Rental approved successfully",
      data: {
        rental,
      },
    });
  } catch (error) {
    next(error);
  }
};

//approval renatal end here
// ============================================================



// ============================================================
// REJECT RENTAL - ADMIN
// ============================================================

const rejectRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    // Only pending requests can be rejected
    if (rental.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending rental requests can be rejected",
      });
    }

    rental.status = "REJECTED";

    await rental.save();

    return res.status(200).json({
      success: true,
      message: "Rental rejected successfully",
      data: {
        rental,
      },
    });
  } catch (error) {
    next(error);
  }
};

//reject rental end here
// ============================================================



// ============================================================
// ISSUE EQUIPMENT - ADMIN
// ============================================================

const issueRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    // Only confirmed rentals can be issued
    if (rental.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed rentals can be issued",
      });
    }

    const equipment = await Equipment.findById(rental.equipment);

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
        message: `Equipment cannot be issued because it is ${equipment.status.toLowerCase()}`,
      });
    }

    // Update rental
    rental.status = "ACTIVE";
    rental.issuedAt = new Date();

    // Update equipment
    equipment.status = "RENTED";

    await rental.save();
    await equipment.save();

    return res.status(200).json({
      success: true,
      message: "Equipment issued successfully",
      data: {
        rental,
        equipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Issue equipment ends here
// =========================================================



// ============================================================
// RETURN EQUIPMENT - ADMIN
// MODIFIED BY: Thasindu
// PURPOSE: Use a simple damaged/not-damaged assessment
// when staff accept returned equipment.
// ============================================================

const returnRental = async (req, res, next) => {
  try {
    const { isDamaged, damageDescription, notes } = req.body;

    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    if (rental.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Only active rentals can be returned",
      });
    }

    // MODIFIED BY: Thasindu
    // PURPOSE: Require an explicit Yes/No damage assessment.
    if (typeof isDamaged !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Please specify whether the equipment was damaged",
      });
    }

    if (isDamaged && !damageDescription?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Damage description is required for damaged equipment",
      });
    }

    const equipment = await Equipment.findById(rental.equipment);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    const returnedAt = new Date();

    // MODIFIED BY: Thasindu
    // PURPOSE: Store the damage assessment in the return history.
    const returnRecord = await Return.create({
      rental: rental._id,
      equipment: equipment._id,
      customer: rental.customer,
      returnedAt,
      isDamaged,
      damageDescription: isDamaged
        ? damageDescription.trim()
        : "",
      notes: notes || "",
      receivedBy: req.user.userId,
    });

    // ==========================================
    // CREATE DAMAGE RECORD WHEN NECESSARY
    // ==========================================

    let damageRecord = null;

    if (isDamaged) {
      damageRecord = await DamageRecord.create({
        rental: rental._id,
        equipment: equipment._id,
        customer: rental.customer,
        returnRecord: returnRecord._id,
        description: damageDescription.trim(),
        reportedBy: req.user.userId,
      });
    }

    // ==========================================
    // UPDATE RENTAL AND EQUIPMENT STATUS
    // ==========================================

    rental.status = "RETURNED";
    rental.returnedAt = returnedAt;

    // MODIFIED BY: Thasindu
    // PURPOSE: Use equipment operational status instead
    // of storing a separate equipment condition.
    if (isDamaged) {
      equipment.status = "DAMAGED";
    } else {
      equipment.status = "AVAILABLE";
    }

    await rental.save();
    await equipment.save();

    return res.status(200).json({
      success: true,
      message: "Equipment returned successfully",
      data: {
        rental,
        equipment,
        returnRecord,
        damageRecord,
      },
    });

  } catch (error) {
    next(error);
  }
};

// END RETURN EQUIPMENT MODIFICATION BY THASINDU


// ==========================================================
// Get all damage records
// ==========================================================

const getAllDamageRecords = async (req, res, next) => {
  try {
    const damageRecords = await DamageRecord.find()
      .populate("customer", "name email")
      // MODIFIED BY: Thasindu
      // PURPOSE: Remove the deleted condition field from populated equipment.
      .populate(
        "equipment",
        "name brand model serialNumber status"
      )
      .populate("reportedBy", "name email")
      .populate("returnRecord")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: damageRecords.length,
      data: {
        damageRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==============================================================


// ==============================================================
// damage status update endpoint
// ==============================================================

const updateDamageRecordStatus = async (req, res, next) => {
  try {
    const { status, repairCost } = req.body;

    const allowedStatuses = [
      "REPORTED",
      "UNDER_INSPECTION",
      "MAINTENANCE",
      "RESOLVED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid damage record status",
      });
    }

    const damageRecord = await DamageRecord.findById(req.params.id);

    if (!damageRecord) {
      return res.status(404).json({
        success: false,
        message: "Damage record not found",
      });
    }

    const equipment = await Equipment.findById(damageRecord.equipment);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    damageRecord.status = status;

    if (repairCost !== undefined) {
      damageRecord.repairCost = repairCost;
    }

    if (status === "UNDER_INSPECTION") {
      equipment.status = "DAMAGED";
    }

    if (status === "MAINTENANCE") {
      equipment.status = "MAINTENANCE";
    }

    // MODIFIED BY: Thasindu
    // PURPOSE: Mark repaired equipment as available without
    // restoring an obsolete condition value.
    if (status === "RESOLVED") {
      damageRecord.resolvedAt = new Date();
      equipment.status = "AVAILABLE";
    } else {
      damageRecord.resolvedAt = null;
    }

    await damageRecord.save();
    await equipment.save();

    return res.status(200).json({
      success: true,
      message: "Damage record updated successfully",
      data: {
        damageRecord,
        equipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================


// =============================================================
// Detect overdue rentals
// =============================================================

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
      data: {
        rentals: overdueRentals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================================



// ===========================================================
// customer rental history
// ===========================================================

const getMyRentals = async (req, res, next) => {
  try {
    const rentals = await Rental.find({
      customer: req.user.userId,
    })
      .populate(
        "equipment",
        "name brand model serialNumber rentalPricePerDay status"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rentals.length,
      data: {
        rentals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =================================================================


// ==========================================================
// customer cancellation of a pending request
// ==========================================================

const cancelRental = async (req, res, next) => {
  try {
    const rental = await Rental.findOne({
      _id: req.params.id,
      customer: req.user.userId,
    });

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    if (rental.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending rental requests can be cancelled",
      });
    }

    rental.status = "CANCELLED";
    await rental.save();

    return res.status(200).json({
      success: true,
      message: "Rental cancelled successfully",
      data: {
        rental,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================



// ============================================================
// complete rental 
// ============================================================

const completeRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    if (rental.status !== "RETURNED") {
      return res.status(400).json({
        success: false,
        message: "Only returned rentals can be completed",
      });
    }

    rental.status = "COMPLETED";

    await rental.save();

    return res.status(200).json({
      success: true,
      message: "Rental completed successfully",
      data: {
        rental,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================================

module.exports = {
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