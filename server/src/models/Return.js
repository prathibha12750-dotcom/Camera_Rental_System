const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true,
      unique: true,
    },

    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    returnedAt: {
      type: Date,
      default: Date.now,
    },

    // ==========================================
    // MODIFICATION: Simplified Return Damage Assessment
    // MODIFIED BY: Thasindu
    // PURPOSE: Record whether equipment was damaged
    // when it was returned, without multiple condition levels.
    // ==========================================
    isDamaged: {
      type: Boolean,
      required: true,
    },

    damageDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    // END MODIFICATION: Return Damage Assessment

    damageDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Return", returnSchema);