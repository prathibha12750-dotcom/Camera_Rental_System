const mongoose = require("mongoose");

const User = require("../models/User");
const Photographer = require("../models/Photographer");
const Availability = require("../models/Availability");
const Booking = require("../models/Booking");


// ==========================================
// HELPERS
// ==========================================

const normalizeDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCHours(0, 0, 0, 0);

  return date;
};


const isValidTime = (value) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    value
  );
};


const timeToMinutes = (value) => {
  const [hours, minutes] =
    value.split(":").map(Number);

  return hours * 60 + minutes;
};


// ==========================================
// SRI LANKA CURRENT DATE / TIME
// ==========================================

const getSriLankaDateTime = () => {

  const now = new Date();


  const dateFormatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Colombo",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );


  const timeFormatter =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Asia/Colombo",

        hour: "2-digit",
        minute: "2-digit",

        hourCycle: "h23",
      }
    );


  return {
    date:
      dateFormatter.format(
        now
      ),

    time:
      timeFormatter.format(
        now
      ),
  };

};


// ==========================================
// CHECK BOOKING CONFLICT
// ==========================================

const bookingHasConflict = async ({
  photographerId,
  date,
  startTime,
  endTime,
  excludeBookingId = null,
}) => {

  const query = {
    photographer: photographerId,

    date,

    status: {
      $in: [
        "REQUESTED",
        "CONFIRMED",
      ],
    },

    startTime: {
      $lt: endTime,
    },

    endTime: {
      $gt: startTime,
    },
  };


  if (excludeBookingId) {
    query._id = {
      $ne: excludeBookingId,
    };
  }


  const conflictingBooking =
    await Booking.findOne(query);


  return Boolean(
    conflictingBooking
  );
};


// ==========================================
// CHECK PHOTOGRAPHER AVAILABILITY
// ==========================================

const isWithinAvailability = async ({
  photographerId,
  date,
  startTime,
  endTime,
}) => {

  const availability =
    await Availability.find({
      photographer:
        photographerId,

      date,
    });


  return availability.some(
    (slot) => {

      const availableStart =
        timeToMinutes(
          slot.startTime
        );

      const availableEnd =
        timeToMinutes(
          slot.endTime
        );

      const requestedStart =
        timeToMinutes(
          startTime
        );

      const requestedEnd =
        timeToMinutes(
          endTime
        );


      return (
        requestedStart >=
          availableStart &&
        requestedEnd <=
          availableEnd
      );
    }
  );
};


// ==========================================
// CREATE BOOKING
// CUSTOMER
// POST /api/customer/bookings
// ==========================================

const createBooking = async (
  req,
  res,
  next
) => {
  try {

    const {
      photographerId,
      date,
      startTime,
      endTime,
      packageRateId,
      notes,
    } = req.body;


    // --------------------------------------
    // Required fields
    // --------------------------------------

    if (!photographerId) {
      return res.status(400).json({
        success: false,
        message:
          "Photographer is required",
      });
    }


    if (
      !mongoose.Types.ObjectId.isValid(
        photographerId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid photographer ID",
      });
    }


    if (!date) {
      return res.status(400).json({
        success: false,
        message:
          "Booking date is required",
      });
    }


    if (!startTime) {
      return res.status(400).json({
        success: false,
        message:
          "Start time is required",
      });
    }


    if (!endTime) {
      return res.status(400).json({
        success: false,
        message:
          "End time is required",
      });
    }


    // --------------------------------------
    // Time validation
    // --------------------------------------

    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Booking times must use HH:MM format",
      });
    }


    if (
      timeToMinutes(endTime) <=
      timeToMinutes(startTime)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End time must be later than start time",
      });
    }


    // --------------------------------------
    // Date validation
    // --------------------------------------

    const normalizedDate =
      normalizeDate(date);


    if (!normalizedDate) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid booking date",
      });
    }


    const today = new Date();

    today.setUTCHours(
      0,
      0,
      0,
      0
    );


    if (normalizedDate < today) {
      return res.status(400).json({
        success: false,
        message:
          "Booking cannot be created for a past date",
      });
    }


    // --------------------------------------
    // Verify customer
    // --------------------------------------

    const customer =
      await User.findById(
        req.user.userId
      );


    if (
      !customer ||
      customer.role !== "CUSTOMER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Customer access required",
      });
    }


    // --------------------------------------
    // Find active photographer
    // --------------------------------------

    const photographer =
      await Photographer.findById(
        photographerId
      ).populate({
        path: "user",
        select:
          "name email role status",
      });


    if (
      !photographer ||
      !photographer.user ||
      photographer.user.role !==
        "PHOTOGRAPHER" ||
      photographer.user.status !==
        "ACTIVE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Photographer not found",
      });
    }


    // --------------------------------------
    // Validate package if selected
    // --------------------------------------

    let selectedPackageId =
      null;


    if (packageRateId) {

      if (
        !mongoose.Types.ObjectId.isValid(
          packageRateId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid package ID",
        });
      }


      const selectedPackage =
        photographer.packageRates.id(
          packageRateId
        );


      if (!selectedPackage) {
        return res.status(400).json({
          success: false,
          message:
            "Selected package does not exist",
        });
      }


      selectedPackageId =
        selectedPackage._id;
    }


    // --------------------------------------
    // Check availability
    // --------------------------------------

    const withinAvailability =
      await isWithinAvailability({
        photographerId:
          photographer._id,

        date:
          normalizedDate,

        startTime,
        endTime,
      });


    if (!withinAvailability) {
      return res.status(409).json({
        success: false,
        message:
          "The photographer is not available for the requested date and time",
      });
    }


    // --------------------------------------
    // Check booking conflicts
    // --------------------------------------

    const hasConflict =
      await bookingHasConflict({
        photographerId:
          photographer._id,

        date:
          normalizedDate,

        startTime,
        endTime,
      });


    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message:
          "The photographer already has a conflicting booking request for this time period",
      });
    }


    // --------------------------------------
    // Create
    // --------------------------------------

    const booking =
      await Booking.create({
        customer:
          customer._id,

        photographer:
          photographer._id,

        date:
          normalizedDate,

        startTime,
        endTime,

        packageRateId:
          selectedPackageId,

        notes:
          notes?.trim() || "",

        status:
          "REQUESTED",
      });


    return res.status(201).json({
      success: true,

      message:
        "Booking request submitted successfully",

      data: {
        booking,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET CUSTOMER BOOKINGS
// GET /api/customer/bookings
// ==========================================

const getCustomerBookings = async (
  req,
  res,
  next
) => {
  try {

    const bookings =
      await Booking.find({
        customer:
          req.user.userId,
      })
        .populate({
          path: "photographer",

          populate: {
            path: "user",
            select:
              "name email",
          },
        })
        .sort({
          createdAt: -1,
        });


    return res.status(200).json({
      success: true,

      data: {
        bookings,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// CUSTOMER CANCEL BOOKING
// PATCH /api/customer/bookings/:id/cancel
// ==========================================

const cancelCustomerBooking = async (
  req,
  res,
  next
) => {
  try {

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking ID",
      });
    }


    const booking =
      await Booking.findOne({
        _id:
          req.params.id,

        customer:
          req.user.userId,
      });


    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }


    if (
      ![
        "REQUESTED",
        "CONFIRMED",
      ].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be cancelled",
      });
    }


    booking.status =
      "CANCELLED";


    await booking.save();


    return res.status(200).json({
      success: true,

      message:
        "Booking cancelled successfully",

      data: {
        booking,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET PHOTOGRAPHER BOOKINGS
// GET /api/photographer/bookings
// ==========================================

const getPhotographerBookings = async (
  req,
  res,
  next
) => {
  try {

    const photographer =
      await Photographer.findOne({
        user:
          req.user.userId,
      });


    if (!photographer) {
      return res.status(404).json({
        success: false,
        message:
          "Photographer profile not found",
      });
    }


    const bookings =
      await Booking.find({
        photographer:
          photographer._id,
      })
        .populate({
          path: "customer",
          select:
            "name email",
        })
        .sort({
          createdAt: -1,
        });


    return res.status(200).json({
      success: true,

      data: {
        bookings,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// PHOTOGRAPHER UPDATE BOOKING STATUS
// PATCH /api/photographer/bookings/:id/status
// ==========================================

const updatePhotographerBookingStatus =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        status,
      } = req.body;


      const allowedStatuses = [
        "CONFIRMED",
        "REJECTED",
        "CANCELLED",
        "COMPLETED",
      ];


      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid booking status",
        });
      }


      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid booking ID",
        });
      }


      const photographer =
        await Photographer.findOne({
          user:
            req.user.userId,
        });


      if (!photographer) {
        return res.status(404).json({
          success: false,
          message:
            "Photographer profile not found",
        });
      }


      const booking =
        await Booking.findOne({
          _id:
            req.params.id,

          photographer:
            photographer._id,
        });


      if (!booking) {
        return res.status(404).json({
          success: false,
          message:
            "Booking not found",
        });
      }


      // --------------------------------------
      // Allowed transitions
      // --------------------------------------

      const validTransitions = {

        REQUESTED: [
          "CONFIRMED",
          "REJECTED",
          "CANCELLED",
        ],

        CONFIRMED: [
          "CANCELLED",
          "COMPLETED",
        ],

        REJECTED: [],

        CANCELLED: [],

        COMPLETED: [],
      };


      if (
        !validTransitions[
          booking.status
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,

          message:
            `Cannot change booking from ${booking.status} to ${status}`,
        });
      }


      // --------------------------------------
      // COMPLETED STATUS VALIDATION
      // --------------------------------------

      if (
        status === "COMPLETED"
      ) {

        const sriLankaNow =
          getSriLankaDateTime();


        const bookingDate =
          booking.date
            .toISOString()
            .split("T")[0];


        // Future date
        if (
          bookingDate >
          sriLankaNow.date
        ) {

          return res.status(400).json({
            success: false,

            message:
              "This booking cannot be marked as completed before the scheduled date.",
          });

        }


        // Today, but service has not ended yet
        if (
          bookingDate ===
            sriLankaNow.date &&
          sriLankaNow.time <
            booking.endTime
        ) {

          return res.status(400).json({
            success: false,

            message:
              `This booking cannot be marked as completed before ${booking.endTime}.`,
          });

        }

      }


      // --------------------------------------
      // Re-check conflict when confirming
      // --------------------------------------

      if (
        status === "CONFIRMED"
      ) {

        const withinAvailability =
          await isWithinAvailability({
            photographerId:
              photographer._id,

            date:
              booking.date,

            startTime:
              booking.startTime,

            endTime:
              booking.endTime,
          });


        if (!withinAvailability) {
          return res.status(409).json({
            success: false,

            message:
              "This booking is no longer within your availability",
          });
        }


        const conflict =
          await bookingHasConflict({
            photographerId:
              photographer._id,

            date:
              booking.date,

            startTime:
              booking.startTime,

            endTime:
              booking.endTime,

            excludeBookingId:
              booking._id,
          });


        if (conflict) {
          return res.status(409).json({
            success: false,

            message:
              "This booking conflicts with another active booking",
          });
        }
      }


      booking.status =
        status;


      await booking.save();


      const updatedBooking =
        await Booking.findById(
          booking._id
        ).populate({
          path: "customer",

          select:
            "name email",
        });


      return res.status(200).json({
        success: true,

        message:
          `Booking status changed to ${status}`,

        data: {
          booking:
            updatedBooking,
        },
      });

    } catch (error) {
      next(error);
    }
  };


module.exports = {
  createBooking,
  getCustomerBookings,
  cancelCustomerBooking,
  getPhotographerBookings,
  updatePhotographerBookingStatus,
};