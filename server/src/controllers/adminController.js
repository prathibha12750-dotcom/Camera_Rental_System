const bcrypt = require("bcryptjs");

const User = require("../models/User");


// ==========================================
// CREATE PHOTOGRAPHER ACCOUNT
// POST /api/admin/photographers
// ==========================================
const createPhotographer = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // --------------------------------------
    // 1. Validate required fields
    // --------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // --------------------------------------
    // 2. Validate password length
    // --------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // --------------------------------------
    // 3. Normalize email
    // --------------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------------
    // 4. Check if email already exists
    // --------------------------------------

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // --------------------------------------
    // 5. Hash password
    // --------------------------------------

    const passwordHash = await bcrypt.hash(password, 12);

    // --------------------------------------
    // 6. Create photographer
    // --------------------------------------

    const photographer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,

      // IMPORTANT:
      // This endpoint can ONLY create photographers.
      role: "PHOTOGRAPHER",

      status: "ACTIVE",
    });

    // --------------------------------------
    // 7. Return safe response
    // --------------------------------------

    return res.status(201).json({
      success: true,
      message: "Photographer account created successfully",
      data: {
        photographer: {
          id: photographer._id,
          name: photographer.name,
          email: photographer.email,
          role: photographer.role,
          status: photographer.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createPhotographer,
};