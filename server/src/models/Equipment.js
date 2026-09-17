const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
      minlength: [2, "Equipment name must be at least 2 characters long"],
      maxlength: [150, "Equipment name cannot exceed 150 characters"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Equipment category is required"],
    },

    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },

    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },

    serialNumber: {
      type: String,
      required: [true, "Serial number is required"],
      unique: true,
      trim: true,
    },

    rentalPricePerDay: {
      type: Number,
      required: [true, "Rental price per day is required"],
      min: [0, "Rental price cannot be negative"],
    },

    securityDeposit: {
      type: Number,
      required: [true, "Security deposit is required"],
      min: [0, "Security deposit cannot be negative"],
    },

    condition: {
      type: String,
      enum: [
        "EXCELLENT",
        "GOOD",
        "FAIR",
        "DAMAGED",
      ],
      default: "GOOD",
    },

    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "RESERVED",
        "RENTED",
        "MAINTENANCE",
        "DAMAGED",
      ],
      default: "AVAILABLE",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Equipment", equipmentSchema);