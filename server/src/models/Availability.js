const mongoose = require("mongoose");


// ==========================================
// AVAILABILITY SCHEMA
// ==========================================

const availabilitySchema = new mongoose.Schema(
  {
    // ----------------------------------------
    // Photographer who owns this slot
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
    // Available date
    // ----------------------------------------

    date: {
      type: Date,
      required: [
        true,
        "Availability date is required",
      ],
      index: true,
    },


    // ----------------------------------------
    // Available start time
    // HH:MM 24-hour format
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


    // ----------------------------------------
    // Available end time
    // HH:MM 24-hour format
    // ----------------------------------------

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
  },
  {
    timestamps: true,
  }
);


// ==========================================
// INDEX FOR COMMON AVAILABILITY LOOKUPS
// ==========================================

availabilitySchema.index({
  photographer: 1,
  date: 1,
});


module.exports = mongoose.model(
  "Availability",
  availabilitySchema
);