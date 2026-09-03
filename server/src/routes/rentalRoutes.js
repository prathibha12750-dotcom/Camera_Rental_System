const express = require("express");

const {
  checkAvailability,
  createRentalRequest,
  getAllRentals,
  approveRental,
  rejectRental,
  issueRental,
  returnRental,
} = require("../controllers/rentalController");

const authenticate = require("../middleware/authenticate");

const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

// Check equipment availability
router.post(
  "/check-availability",
  authenticate,
  checkAvailability
);

//create rental request
router.post(
  "/",
  authenticate,
  createRentalRequest
);

//get all rentals by admin
router.get(
  "/",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getAllRentals
);

//approve rental
router.patch(
  "/:id/approve",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  approveRental
);

//reject rental
router.patch(
  "/:id/reject",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  rejectRental
);

//issue equipment
router.patch(
  "/:id/issue",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  issueRental
);

//return rental
router.patch(
  "/:id/return",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  returnRental
);
module.exports = router;