const mongoose = require("mongoose");


// ==========================================
// BOOKING SCHEMA
// ==========================================

const bookingSchema = new mongoose.Schema(
  {
    // ----------------------------------------
    // Customer
    // ----------------------------------------

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        "Customer reference is required",
      ],
      index: true,
    },


    // ----------------------------------------
    // Photographer
    // ----------------------------------------

    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: [
        true,
        "Photographer reference is required",
      ],
      index: true,
    },


    // ----------------------------------------
    // Booking date
    // ----------------------------------------

    date: {
      type: Date,
      required: [
        true,
        "Booking date is required",
      ],
      index: true,
    },


    // ----------------------------------------
    // Booking time period
    // ----------------------------------------

    startTime: {
      type: String,
      required: [
        true,
        "Start time is required",
      ],
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Start time must use HH:MM format",
      ],
    },


    endTime: {
      type: String,
      required: [
        true,
        "End time is required",
      ],
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "End time must use HH:MM format",
      ],
    },


    // ----------------------------------------
    // Optional selected package
    // This points to the _id of one of the
    // Photographer packageRates subdocuments.
    // ----------------------------------------

    packageRateId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // ----------------------------------------
    // Pricing information
    // ----------------------------------------

    pricingType: {
      type: String,
      enum: [
        "HOURLY",
        "PACKAGE",
      ],
      required: true,
    },

    durationHours: {
      type: Number,
      min: 0,
      required: true,
    },

    hourlyRateAtBooking: {
      type: Number,
      min: 0,
      default: null,
    },

    packageNameAtBooking: {
      type: String,
      trim: true,
      default: null,
    },

    packagePriceAtBooking: {
      type: Number,
      min: 0,
      default: null,
    },

    totalAmount: {
      type: Number,
      min: 0,
      required: true,
    },


    // ----------------------------------------
    // Booking notes
    // ----------------------------------------

    notes: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Booking notes cannot exceed 500 characters",
      ],
      default: "",
    },


    // ----------------------------------------
    // Booking status
    // ----------------------------------------

    status: {
      type: String,

      enum: [
        "REQUESTED",
        "CONFIRMED",
        "REJECTED",
        "CANCELLED",
        "COMPLETED",
      ],

      default: "REQUESTED",

      index: true,
    },
  },
  {
    timestamps: true,
  }
);


// ==========================================
// COMMON QUERY INDEX
// ==========================================

bookingSchema.index({
  photographer: 1,
  date: 1,
  status: 1,
});


module.exports = mongoose.model(
  "Booking",
  bookingSchema
);