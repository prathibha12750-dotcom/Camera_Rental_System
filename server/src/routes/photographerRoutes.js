const express = require("express");

const requirePasswordChangeComplete = require("../middleware/requirePasswordChangeComplete");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const authenticateSubscription = require("../middleware/authenticateSubscription");
const uploadSubscriptionReceipt = require("../middleware/uploadSubscriptionReceipt");


const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/photographerController");

const {
  getMyPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} = require("../controllers/portfolioController");

const {
  getMyAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} = require("../controllers/availabilityController");

const {
  getPhotographerBookings,
  updatePhotographerBookingStatus,
} = require(
  "../controllers/bookingController"
);

const {
  getMyNotifications,
  markNotificationAsRead,
} = require(
  "../controllers/photographerNotificationController"
);

const {
  getMySubscription,
  paySubscription,
  getMySubscriptionPayments,
} = require(
  "../controllers/photographerSubscriptionController"
);

const router = express.Router();

// ==========================================
// PHOTOGRAPHER SUBSCRIPTION
// ACTIVE OR SUBSCRIPTION-EXPIRED PHOTOGRAPHER
// ==========================================

router.get(
  "/subscription",
  authenticateSubscription,
  getMySubscription
);

router.post(
  "/subscription/payment",
  authenticateSubscription,
  uploadSubscriptionReceipt.single("receipt"),
  paySubscription
);

router.get(
  "/subscription/payments",
  authenticateSubscription,
  getMySubscriptionPayments
);


// ==========================================
// ALL ROUTES BELOW REQUIRE PHOTOGRAPHER
// ==========================================

router.use(
  authenticate,
  authorizeRoles("PHOTOGRAPHER"),
  requirePasswordChangeComplete
);


// ==========================================
// PHOTOGRAPHER PROFILE
// ==========================================

router.get(
  "/profile",
  getMyProfile
);

router.put(
  "/profile",
  updateMyProfile
);


// ==========================================
// PORTFOLIO
// ==========================================

router.get(
  "/portfolio",
  getMyPortfolio
);


router.post(
  "/portfolio",
  createPortfolioItem
);


router.put(
  "/portfolio/:id",
  updatePortfolioItem
);


router.delete(
  "/portfolio/:id",
  deletePortfolioItem
);


// ==========================================
// AVAILABILITY
// ==========================================

router.get(
  "/availability",
  getMyAvailability
);


router.post(
  "/availability",
  createAvailability
);


router.put(
  "/availability/:id",
  updateAvailability
);


router.delete(
  "/availability/:id",
  deleteAvailability
);


// ==========================================
// PHOTOGRAPHER BOOKINGS
// ==========================================

router.get(
  "/bookings",
  getPhotographerBookings
);


router.patch(
  "/bookings/:id/status",
  updatePhotographerBookingStatus
);

// ==========================================
// PHOTOGRAPHER NOTIFICATIONS
// ==========================================

router.get(
  "/notifications",
  getMyNotifications
);

router.patch(
  "/notifications/:id/read",
  markNotificationAsRead
);


module.exports = router;