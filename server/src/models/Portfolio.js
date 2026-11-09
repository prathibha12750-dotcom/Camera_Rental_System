const mongoose = require("mongoose");


// ==========================================
// PORTFOLIO SCHEMA
// ==========================================

const portfolioSchema = new mongoose.Schema(
  {
    // ----------------------------------------
    // Photographer who owns this item
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
    // Portfolio item title
    // ----------------------------------------

    title: {
      type: String,
      required: [
        true,
        "Portfolio title is required",
      ],
      trim: true,
      minlength: [
        2,
        "Portfolio title must be at least 2 characters long",
      ],
      maxlength: [
        120,
        "Portfolio title cannot exceed 120 characters",
      ],
    },


    // ----------------------------------------
    // Description
    // ----------------------------------------

    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Portfolio description cannot exceed 1000 characters",
      ],
      default: "",
    },


    // ----------------------------------------
    // Image URL
    // ----------------------------------------

    imageUrl: {
      type: String,
      required: [
        true,
        "Portfolio image URL is required",
      ],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model(
  "Portfolio",
  portfolioSchema
);