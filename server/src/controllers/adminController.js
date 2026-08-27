const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Photographer = require("../models/Photographer");


// ==========================================
// CREATE PHOTOGRAPHER ACCOUNT
// POST /api/admin/photographers
// ==========================================
const createPhotographer = async (req, res, next) => {
  let createdUser = null;

  try {
    const {
      name,
      email,
      password,
    } = req.body;


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

    const normalizedEmail =
      email.trim().toLowerCase();


    // --------------------------------------
    // 4. Check existing user
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

    const passwordHash =
      await bcrypt.hash(password, 12);


    // --------------------------------------
    // 6. Create User account
    // --------------------------------------

    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,

      // This endpoint can only create
      // Photographer accounts.
      role: "PHOTOGRAPHER",

      status: "ACTIVE",
    });


    // --------------------------------------
    // 7. Create Photographer profile
    // --------------------------------------

    const photographer =
      await Photographer.create({
        user: createdUser._id,

        // Professional information starts
        // empty and can be completed later
        // by the photographer.
        bio: "",
        specialization: "",
        location: "",
        hourlyRate: null,
        packageRates: [],
        profileImage: "",
      });


    // --------------------------------------
    // 8. Return safe response
    // --------------------------------------

    return res.status(201).json({
      success: true,
      message: "Photographer account created successfully",

      data: {
        photographer: {
          id: photographer._id,
          userId: createdUser._id,

          name: createdUser.name,
          email: createdUser.email,

          role: createdUser.role,
          status: createdUser.status,

          profile: {
            bio: photographer.bio,
            specialization:
              photographer.specialization,
            location:
              photographer.location,
            hourlyRate:
              photographer.hourlyRate,
            packageRates:
              photographer.packageRates,
            profileImage:
              photographer.profileImage,
          },
        },
      },
    });

  } catch (error) {

    // --------------------------------------
    // Roll back User if Photographer
    // profile creation failed.
    // --------------------------------------

    if (createdUser) {
      try {
        await User.findByIdAndDelete(
          createdUser._id
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean up User after Photographer creation error:",
          cleanupError
        );
      }
    }

    next(error);
  }
};


module.exports = {
  createPhotographer,
};