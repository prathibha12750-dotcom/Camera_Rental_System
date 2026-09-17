const mongoose = require("mongoose");

const damageRecordSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true,
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

    returnRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return",
      required: true,
    },

    description: {
      type: String,
      required: [true, "Damage description is required"],
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: [
        "REPORTED",
        "UNDER_INSPECTION",
        "MAINTENANCE",
        "RESOLVED",
      ],
      default: "REPORTED",
    },

    repairCost: {
      type: Number,
      min: 0,
      default: 0,
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DamageRecord",
  damageRecordSchema
);