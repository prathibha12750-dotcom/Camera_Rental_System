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

const {
  createBooking,
  getCustomerBookings,
  cancelCustomerBooking,
} = require(
  "../controllers/bookingController"
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
// PUBLIC
// ==========================================

// Anyone can discover photographers
router.get(
  "/photographers",
  getPhotographers
);

router.get(
  "/photographers/:id",
  getPhotographerDetails
);

// ==========================================
// PHOTOGRAPHER BOOKINGS
// CUSTOMER ONLY
// ==========================================

router.get(
  "/bookings",
  authenticate,
  authorizeRoles("CUSTOMER"),
  getCustomerBookings
);


router.post(
  "/bookings",
  authenticate,
  authorizeRoles("CUSTOMER"),
  createBooking
);


router.patch(
  "/bookings/:id/cancel",
  authenticate,
  authorizeRoles("CUSTOMER"),
  cancelCustomerBooking
);

module.exports = router;