const bcrypt = require("bcryptjs");

const User = require("../models/User");

//added by abilash
// FR-085: Record account-related system activities
const { logActivity } = require("../services/auditLogService");
//ended by abilash

const { generateToken } = require("../utils/jwt");
const {
  validateRegistration,
  validateLogin,
} = require("../validators/authValidator");


// ==========================================
// CUSTOMER REGISTRATION
// POST /api/auth/register
// ==========================================
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const errors = validateRegistration({
      name,
      email,
      password,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,

      // IMPORTANT:
      // Public registration ALWAYS creates CUSTOMER.
      role: "CUSTOMER",

      status: "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Customer account created successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const errors = validateLogin({
      email,
      password,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordIsCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    
    //added by abilash
    // FR-085: Record successful user login
    await logActivity({
      actor: user._id,
      actorRole: user.role,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user._id,
      outcome: "SUCCESS",
      message: "User logged in successfully.",
    });
    //ended by abilash


    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// LOGOUT
// POST /api/auth/logout
// ==========================================
const logout = async (req, res, next) => {
  try {
    /*
      We are currently using a stateless JWT access-token approach.

      Therefore the backend does not store active JWT tokens.

      The frontend should remove the token during logout.

      A more advanced token revocation/refresh-token system
      can be added later if required.
    */
    
    //added by abilash
    // FR-085: Record authenticated logout request
    await logActivity({
      actor: req.user.userId,
      actorRole: req.user.role || "SYSTEM",
      action: "USER_LOGOUT",
      entityType: "User",
      entityId: req.user.userId,
      outcome: "SUCCESS",
      message: "User requested logout successfully.",
    });
    //ended by abilash

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET CURRENT USER
// GET /api/auth/me
// ==========================================
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// CHANGE TEMPORARY PASSWORD
// PUT /api/auth/change-temporary-password
// AUTHENTICATED USER
// ==========================================

const changeTemporaryPassword =
  async (req, res, next) => {
    try {
      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;


      // ======================================
      // REQUIRED FIELDS
      // ======================================

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Current password, new password and password confirmation are required.",
        });
      }


      // ======================================
      // NEW PASSWORD LENGTH
      // ======================================

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be at least 8 characters long.",
        });
      }


      // ======================================
      // PASSWORD CONFIRMATION
      // ======================================

      if (
        newPassword !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password and confirmation do not match.",
        });
      }


      // ======================================
      // LOAD USER WITH PASSWORD HASH
      // ======================================

      const user =
        await User.findById(
          req.user.userId
        ).select("+passwordHash");

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }


      // ======================================
      // ONLY REQUIRED WHEN FLAG IS ACTIVE
      // ======================================

      if (
        !user.mustChangePassword
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A temporary password change is not required for this account.",
        });
      }


      // ======================================
      // VERIFY CURRENT TEMPORARY PASSWORD
      // ======================================

      const passwordIsCorrect =
        await bcrypt.compare(
          currentPassword,
          user.passwordHash
        );

      if (!passwordIsCorrect) {
        return res.status(401).json({
          success: false,
          message:
            "Current password is incorrect.",
        });
      }


      // ======================================
      // PREVENT REUSING TEMPORARY PASSWORD
      // ======================================

      const isSamePassword =
        await bcrypt.compare(
          newPassword,
          user.passwordHash
        );

      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message:
            "Your new password must be different from your temporary password.",
        });
      }


      // ======================================
      // SAVE NEW PASSWORD
      // ======================================

      user.passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      user.mustChangePassword =
        false;

      await user.save();

      
      //added by abilash
      // FR-085: Audit successful temporary password changes
      await logActivity({
        actor: user._id,
        actorRole: user.role,
        action: "PASSWORD_CHANGED",
        entityType: "User",
        entityId: user._id,
        outcome: "SUCCESS",
        message: "User successfully changed their temporary password.",
      });
      //ended by abilash



      // ======================================
      // RETURN UPDATED USER
      // ======================================

      return res.status(200).json({
        success: true,

        message:
          "Password changed successfully.",

        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            mustChangePassword:
              user.mustChangePassword,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  
//added by abilash
// FR-169: Update the authenticated user's basic profile
const updateMyProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must contain 2 to 100 characters.",
      });
    }

    if (
      normalizedEmail.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.role !== "STAFF_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "This profile update is restricted to staff administrators.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email address is already in use.",
      });
    }

    user.name = normalizedName;
    user.email = normalizedEmail;

    await user.save();

    
    //added by abilash
    // FR-085: Audit successful Admin profile updates
    await logActivity({
      actor: user._id,
      actorRole: user.role,
      action: "ADMIN_PROFILE_UPDATED",
      entityType: "User",
      entityId: user._id,
      outcome: "SUCCESS",
      message: "Administrator updated their basic profile.",
    });
    //ended by abilash


    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email address is already in use.",
      });
    }

    next(error);
  }
};
//ended by abilash




module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  changeTemporaryPassword,
  //added by abilash
  updateMyProfile,
  //ended by abilash
};
