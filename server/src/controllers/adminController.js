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


// Adding controller by Abilash started here


// ==========================================
// GET ALL CUSTOMERS
// GET /api/admin/customers
// ==========================================
const getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find(
      {
        role: "CUSTOMER",
        status: "ACTIVE",
      },
      {
        name: 1,
        email: 1,
        status: 1,
      }
    ).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: {
        customers,
      },
    });
  } catch (error) {
    next(error);
  }
};


// Adding controller by Abilash started here

module.exports = {
  createPhotographer,
  getCustomers, //exported by Abilash
};