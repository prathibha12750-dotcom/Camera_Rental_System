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

module.exports = {
  checkAvailability,
  createRentalRequest,
};