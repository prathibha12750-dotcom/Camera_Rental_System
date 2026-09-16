const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [150, "Email cannot exceed 150 characters"],
    },

    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false
    },

    role: {
      type: String,
      enum: ["CUSTOMER", "PHOTOGRAPHER", "STAFF_ADMIN"],
      required: true,
      default: "CUSTOMER",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);