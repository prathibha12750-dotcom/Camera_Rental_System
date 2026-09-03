const express = require("express");

const {
  checkAvailability,
  createRentalRequest,
} = require("../controllers/rentalController");

const authenticate = require("../middleware/authenticate");

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

module.exports = router;