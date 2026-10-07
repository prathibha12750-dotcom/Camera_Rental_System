const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {syncPhotographerSubscription,} = require("../services/photographerSubscriptionService");


// ==========================================
// PHOTOGRAPHER SUBSCRIPTION AUTHENTICATION
// ==========================================

const authenticateSubscription =
  async (req, res, next) => {
    try {
      // ----------------------------------------
      // Get bearer token
      // ----------------------------------------

      const authHeader =
        req.headers.authorization;

      if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
      ) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }


      const token =
        authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication token is missing",
        });
      }


      // ----------------------------------------
      // Verify JWT
      // ----------------------------------------

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );


      // ----------------------------------------
      // Load user
      // ----------------------------------------

      const user =
        await User.findById(
          decoded.userId
        );

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "User account no longer exists",
        });
      }


      // ----------------------------------------
      // Only Photographer accounts
      // ----------------------------------------

      if (user.role !== "PHOTOGRAPHER") {
        return res.status(403).json({
          success: false,
          message:
            "Photographer access required",
        });
      }

      // ----------------------------------------
      // Synchronize subscription lifecycle
      // ----------------------------------------

      await syncPhotographerSubscription(user);


      // ----------------------------------------
      // Admin-disabled accounts remain blocked
      // ----------------------------------------

      if (
        user.disabledReason ===
        "ADMIN_DISABLED"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been disabled by the administrator.",
        });
      }


      // ----------------------------------------
      // Allowed account states
      //
      // ACTIVE:
      //   Can view/pay subscription.
      //
      // INACTIVE + SUBSCRIPTION_EXPIRED:
      //   Can access subscription renewal only.
      // ----------------------------------------

      const activeAccount =
        user.status === "ACTIVE";

      const expiredSubscriptionAccount =
        user.status === "INACTIVE" &&
        user.disabledReason ===
          "SUBSCRIPTION_EXPIRED";


      if (
        !activeAccount &&
        !expiredSubscriptionAccount
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account cannot access subscription services.",
        });
      }


      // ----------------------------------------
      // Attach authenticated user
      // ----------------------------------------

      req.user = {
        userId: user._id.toString(),
        role: user.role,
        status: user.status,
        disabledReason:
          user.disabledReason,
        mustChangePassword:
          user.mustChangePassword,
      };


      next();
    } catch (error) {
      if (
        error.name ===
        "TokenExpiredError"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication token has expired",
        });
      }

      if (
        error.name ===
        "JsonWebTokenError"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid authentication token",
        });
      }

      next(error);
    }
  };


module.exports =
  authenticateSubscription;