const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalPrice: {
      type: Number,
      min: 0,
    },

    
    //added by abilash

    // Security deposit required for this rental
    // Snapshot of the equipment deposit at booking time
    securityDeposit: {
      type: Number,
      min: [0, "Security deposit cannot be negative"],
      default: null,
    },

    //ended by abilash


    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "ACTIVE",
        "RETURNED",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    issuedAt: {
      type: Date,
      default: null,
    },

    returnedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Rental", rentalSchema);