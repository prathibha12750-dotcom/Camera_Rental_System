const Photographer = require("../models/Photographer");
const User = require("../models/User");


// ==========================================
// GET MY PHOTOGRAPHER PROFILE
// GET /api/photographer/profile
// ==========================================

const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const photographer = await Photographer.findOne({
      user: userId,
    }).populate({
      path: "user",
      select: "name email role status",
    });

    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: "Photographer profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        photographer,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// UPDATE MY PHOTOGRAPHER PROFILE
// PUT /api/photographer/profile
// ==========================================

const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const {
      name,
      email,
      bio,
      specialization,
      location,
      hourlyRate,
      packageRates,
      profileImage,
    } = req.body;


    // --------------------------------------
    // Find User
    // --------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Photographer account not found",
      });
    }


    // --------------------------------------
    // Extra role protection
    // --------------------------------------

    if (user.role !== "PHOTOGRAPHER") {
      return res.status(403).json({
        success: false,
        message: "Only photographers can update this profile",
      });
    }


    // --------------------------------------
    // Find Photographer profile
    // --------------------------------------

    const photographer =
      await Photographer.findOne({
        user: userId,
      });

    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: "Photographer profile not found",
      });
    }


    // ======================================
    // UPDATE USER INFORMATION
    // ======================================

    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      if (trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must be at least 2 characters long",
        });
      }

      user.name = trimmedName;
    }


    if (email !== undefined) {
      const normalizedEmail =
        email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: userId,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }

      user.email = normalizedEmail;
    }


    // ======================================
    // UPDATE PROFESSIONAL INFORMATION
    // ======================================

    if (bio !== undefined) {
      photographer.bio = bio.trim();
    }


    if (specialization !== undefined) {
      photographer.specialization =
        specialization.trim();
    }


    if (location !== undefined) {
      photographer.location =
        location.trim();
    }


    // --------------------------------------
    // Hourly rate
    // --------------------------------------

    if (hourlyRate !== undefined) {
      if (
        hourlyRate !== null &&
        (typeof hourlyRate !== "number" ||
          hourlyRate < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Hourly rate must be a non-negative number",
        });
      }

      photographer.hourlyRate = hourlyRate;
    }


    // --------------------------------------
    // Package rates
    // --------------------------------------

    if (packageRates !== undefined) {
      if (!Array.isArray(packageRates)) {
        return res.status(400).json({
          success: false,
          message: "Package rates must be an array",
        });
      }

      photographer.packageRates =
        packageRates;
    }


    // --------------------------------------
    // Profile image
    // --------------------------------------

    if (profileImage !== undefined) {
      photographer.profileImage =
        profileImage.trim();
    }


    // ======================================
    // SAVE
    // ======================================

    await user.save();
    await photographer.save();


    // ======================================
    // RETURN UPDATED PROFILE
    // ======================================

    const updatedPhotographer =
      await Photographer.findOne({
        user: userId,
      }).populate({
        path: "user",
        select: "name email role status",
      });


    return res.status(200).json({
      success: true,
      message: "Photographer profile updated successfully",
      data: {
        photographer: updatedPhotographer,
      },
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMyProfile,
  updateMyProfile,
};