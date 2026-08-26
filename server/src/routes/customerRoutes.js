const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
  changePassword,
} = require("../controllers/customerController");

const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();


// ==========================================
// CUSTOMER PROFILE
// ==========================================

// GET MY PROFILE
router.get(
  "/profile",
  authenticate,
  authorizeRoles("CUSTOMER"),
  getMyProfile
);


// UPDATE MY PROFILE
router.put(
  "/profile",
  authenticate,
  authorizeRoles("CUSTOMER"),
  updateMyProfile
);


// CHANGE PASSWORD
router.put(
  "/change-password",
  authenticate,
  authorizeRoles("CUSTOMER"),
  changePassword
);


module.exports = router;