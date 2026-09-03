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
// ============================================================

const returnRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    // Only active rentals can be returned
    if (rental.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Only active rentals can be returned",
      });
    }

    const equipment = await Equipment.findById(rental.equipment);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    // Update rental
    rental.status = "RETURNED";
    rental.returnedAt = new Date();

    // Normal return: equipment becomes available again
    equipment.status = "AVAILABLE";

    await rental.save();
    await equipment.save();

    return res.status(200).json({
      success: true,
      message: "Equipment returned successfully",
      data: {
        rental,
        equipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// return equipment ends here
// =========================================================

module.exports = {
  checkAvailability,
  createRentalRequest,
  getAllRentals,
  approveRental,
  rejectRental,
  issueRental,
  returnRental, 
};