const express = require("express");

const {
  checkAvailability,
  createRentalRequest,
  getAllRentals,
  approveRental,
  rejectRental,
  issueRental,
  returnRental,
  getAllDamageRecords,
  updateDamageRecordStatus,
  getOverdueRentals,
  getMyRentals,
  cancelRental,
  completeRental,
} = require("../controllers/rentalController");

const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();


// ==========================================
// EQUIPMENT AVAILABILITY
// AUTHENTICATED USERS
// ==========================================

router.post(
  "/check-availability",
  authenticate,
  checkAvailability
);


// ==========================================
// CREATE RENTAL REQUEST
// AUTHENTICATED USERS
// ==========================================

router.post(
  "/",
  authenticate,
  createRentalRequest
);


// ==========================================
// GET ALL RENTALS
// CLERK OR ADMIN
// ==========================================

router.get(
  "/",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getAllRentals
);


// ==========================================
// GET ALL DAMAGE RECORDS
// CLERK OR ADMIN
// ==========================================

router.get(
  "/damage-records",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getAllDamageRecords
);


// ==========================================
// GET OVERDUE RENTALS
// CLERK OR ADMIN
// ==========================================

router.get(
  "/overdue",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getOverdueRentals
);


// ==========================================
// CUSTOMER RENTAL HISTORY
// AUTHENTICATED USERS
// ==========================================

router.get(
  "/my-rentals",
  authenticate,
  getMyRentals
);


// ==========================================
// APPROVE RENTAL
// CLERK OR ADMIN
// ==========================================

router.patch(
  "/:id/approve",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  approveRental
);


// ==========================================
// REJECT RENTAL
// CLERK OR ADMIN
// ==========================================

router.patch(
  "/:id/reject",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  rejectRental
);


// ==========================================
// ISSUE EQUIPMENT
// CLERK OR ADMIN
// ==========================================

router.patch(
  "/:id/issue",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  issueRental
);


// ==========================================
// RETURN RENTAL / EQUIPMENT
// CLERK OR ADMIN
// ==========================================

router.patch(
  "/:id/return",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  returnRental
);


// ==========================================
// UPDATE DAMAGE RECORD STATUS
// CLERK OR ADMIN
// ==========================================

router.patch(
  "/damage-records/:id/status",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  updateDamageRecordStatus
);


// ==========================================
// CANCEL RENTAL
// AUTHENTICATED USERS
// ==========================================

router.patch(
  "/:id/cancel",
  authenticate,
  cancelRental
);


// ==========================================
// COMPLETE RENTAL
// CLERK OR ADMIN
// ==========================================

router.patch(
  "/:id/complete",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  completeRental
);


module.exports = router;