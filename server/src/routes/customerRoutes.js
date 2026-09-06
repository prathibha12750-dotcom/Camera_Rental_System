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

const {
  createReview,
  getPhotographerReviews,
  getCustomerReviews,
} = require(
  "../controllers/reviewController"
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
// PHOTOGRAPHER REVIEWS
// PUBLIC READ
// ==========================================

router.get(
  "/photographers/:id/reviews",
  getPhotographerReviews
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


// ==========================================
// CUSTOMER REVIEW
// CUSTOMER ONLY
// ==========================================

router.post(
  "/bookings/:id/review",
  authenticate,
  authorizeRoles("CUSTOMER"),
  createReview
);

router.get(
  "/reviews",
  authenticate,
  authorizeRoles("CUSTOMER"),
  getCustomerReviews
);

module.exports = router;