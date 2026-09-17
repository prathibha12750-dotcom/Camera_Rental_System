const bcrypt = require("bcryptjs");

const User = require("../models/User");


// ==========================================
// GET MY PROFILE
// GET /api/customer/profile
// ==========================================

const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    // Extra protection:
    // This endpoint is only for customers.
    if (user.role !== "CUSTOMER") {
      return res.status(403).json({
        success: false,
        message: "Only customers can access this profile",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// UPDATE MY PROFILE
// PUT /api/customer/profile
// ==========================================

const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const {
      name,
      email,
    } = req.body;


    // --------------------------------------
    // Find current user
    // --------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }


    // --------------------------------------
    // Make sure user is a customer
    // --------------------------------------

    if (user.role !== "CUSTOMER") {
      return res.status(403).json({
        success: false,
        message: "Only customers can update this profile",
      });
    }


    // --------------------------------------
    // Validate name
    // --------------------------------------

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }


    // --------------------------------------
    // Update email
    // --------------------------------------

    if (email !== undefined) {
      const normalizedEmail =
        email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }


      // Check whether another account
      // already uses this email.

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: userId,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists",
        });
      }

      user.email = normalizedEmail;
    }


    // --------------------------------------
    // IMPORTANT:
    // Do NOT allow these fields here:
    //
    // role
    // passwordHash
    // status
    // --------------------------------------

    await user.save();


    // --------------------------------------
    // Safe response
    // --------------------------------------

    const updatedUser = await User.findById(
      userId
    ).select("-passwordHash");


    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// CHANGE PASSWORD
// PUT /api/customer/change-password
// ==========================================

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const {
      currentPassword,
      newPassword,
    } = req.body;


    // --------------------------------------
    // Validate fields
    // --------------------------------------

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });
    }


    // --------------------------------------
    // Password length
    // --------------------------------------

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long",
      });
    }


    // --------------------------------------
    // Find customer
    // --------------------------------------

    const user = await User.findById(userId).select("+passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }


    // --------------------------------------
    // Verify role
    // --------------------------------------

    if (user.role !== "CUSTOMER") {
      return res.status(403).json({
        success: false,
        message:
          "Only customers can change this password",
      });
    }


    // --------------------------------------
    // Check current password
    // --------------------------------------

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }


    // --------------------------------------
    // Prevent same password
    // --------------------------------------

    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.passwordHash
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from the current password",
      });
    }


    // --------------------------------------
    // Hash new password
    // --------------------------------------

    user.passwordHash = await bcrypt.hash(
      newPassword,
      12
    );


    await user.save();


    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
};