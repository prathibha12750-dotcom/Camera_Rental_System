const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
  changePassword,
} = require("../controllers/customerController");

const {
  getPhotographers,
  getPhotographerDetails,
} = require(
  "../controllers/photographerDiscoveryController"
);

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


// ==========================================
// PHOTOGRAPHER DISCOVERY
// CUSTOMER ONLY
// ==========================================

router.get(
  "/photographers",
  authenticate,
  authorizeRoles("CUSTOMER"),
  getPhotographers
);


router.get(
  "/photographers/:id",
  authenticate,
  authorizeRoles("CUSTOMER"),
  getPhotographerDetails
);
module.exports = router;