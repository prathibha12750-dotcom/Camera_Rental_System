const mongoose = require("mongoose");

const photographerApplicationSchema =
  new mongoose.Schema(
    {
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },

      professionalEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        maxlength: 150,
        },

      phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 30,
      },

      specialization: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      experienceYears: {
        type: Number,
        required: true,
        min: 0,
        max: 80,
      },

      location: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      bio: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1500,
      },

      portfolioUrl: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

      expectedHourlyRate: {
        type: Number,
        min: 0,
        default: 0,
      },

      reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1500,
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "APPROVED",
          "REJECTED",
        ],
        default: "PENDING",
      },

      adminNote: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

photographerApplicationSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "PhotographerApplication",
  photographerApplicationSchema
);