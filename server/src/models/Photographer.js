const mongoose = require("mongoose");


// ==========================================
// PACKAGE RATE SUB-SCHEMA
// ==========================================

const packageRateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
      minlength: [2, "Package name must be at least 2 characters long"],
      maxlength: [100, "Package name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Package description cannot exceed 500 characters",
      ],
      default: "",
    },

    price: {
      type: Number,
      required: [true, "Package price is required"],
      min: [0, "Package price cannot be negative"],
    },
  },
  {
    _id: true,
  }
);


// ==========================================
// PHOTOGRAPHER SCHEMA
// ==========================================

const photographerSchema = new mongoose.Schema(
  {
    // ----------------------------------------
    // Link to User account
    // ----------------------------------------

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
      index: true,
    },


    // ----------------------------------------
    // Professional biography
    // ----------------------------------------

    bio: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Biography cannot exceed 1000 characters",
      ],
      default: "",
    },


    // ----------------------------------------
    // Photography specialization
    // ----------------------------------------

    specialization: {
      type: String,
      trim: true,
      maxlength: [
        150,
        "Specialization cannot exceed 150 characters",
      ],
      default: "",
    },


    // ----------------------------------------
    // Photographer location
    // ----------------------------------------

    location: {
      type: String,
      trim: true,
      maxlength: [
        150,
        "Location cannot exceed 150 characters",
      ],
      default: "",
    },


    // ----------------------------------------
    // Hourly rate
    // ----------------------------------------

    hourlyRate: {
      type: Number,
      min: [0, "Hourly rate cannot be negative"],
      default: null,
    },


    // ----------------------------------------
    // Photography packages
    // ----------------------------------------

    packageRates: {
      type: [packageRateSchema],
      default: [],
    },


    // ----------------------------------------
    // Profile image
    // ----------------------------------------

    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model(
  "Photographer",
  photographerSchema
);