const express = require("express");

const {
  getRentalCalendar,
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
  getMyRentalById,
  cancelRental,
  completeRental,
} = require("../controllers/rentalController");

const {
  approveRentalPayment,
  rejectRentalPayment,
  getPendingRentalPayments,
  getRentalPaymentHistory,
  viewRentalPaymentReceipt,
} = require("../controllers/rentalPaymentController");

const {
  settleRentalDeposit,
  prepareRentalDepositRefund,
  reviewDamageDeduction,
  createPendingRentalRefund,
  confirmRentalRefundPayout,
  settleFullRentalDepositDeduction,
} = require("../controllers/rentalDepositSettlementController");

const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();



 // ==========================================
 // GET EQUIPMENT RENTAL CALENDAR
 // AUTHENTICATED USERS
 // ==========================================

 router.get(
   "/calendar/:equipmentId",
   authenticate,
   getRentalCalendar
 );

 // ==========================================
 // CHECK EQUIPMENT AVAILABILITY
 // AUTHENTICATED USERS
 // ==========================================

 router.post(
   "/check-availability",
   authenticate,
   checkAvailability
 );


// CREATE RENTAL REQUEST — CUSTOMER ONLY
router.post(
  "/",
  authenticate,
  authorizeRoles("CUSTOMER"),
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


// VIEW OWN RENTALS — CUSTOMER ONLY
router.get(
  "/my-rentals",
  authenticate,
  authorizeRoles("CUSTOMER"),
  getMyRentals
);

 // ==========================================
 // GET SINGLE RENTAL DETAILS
 // CUSTOMER ONLY
 // ==========================================

router.get(
  "/my-rentals/:id",
  authenticate,
  authorizeRoles("CUSTOMER"),
  getMyRentalById
);

 // ==========================================
 // GET PENDING RENTAL PAYMENTS
 // CLERK OR STAFF_ADMIN
 // ==========================================

router.get(
  "/payments/pending",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getPendingRentalPayments
);


 // ==========================================
 // RENTAL PAYMENT HISTORY
 // CLERK / STAFF ADMIN
 // ==========================================

router.get(
  "/payments/history",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getRentalPaymentHistory
);


 // ==========================================
 // VIEW RENTAL PAYMENT RECEIPT
 // CLERK OR STAFF_ADMIN
 // ==========================================

router.get(
  "/payments/:paymentId/receipt",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  viewRentalPaymentReceipt
);


// ==========================================
// APPROVE RENTAL PAYMENT RECEIPT
// CLERK OR STAFF_ADMIN
// ==========================================

router.patch(
  "/payments/:paymentId/approve",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  approveRentalPayment
);


 // ==========================================
 // REJECT RENTAL PAYMENT RECEIPT
 // CLERK OR STAFF_ADMIN
 // ==========================================

router.patch(
  "/payments/:paymentId/reject",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  rejectRentalPayment
);


 // ==========================================
 // PREPARE RENTAL DEPOSIT REFUND
 // VALIDATION ONLY - NO FINANCIAL CHANGES
 // ==========================================

router.post(
  "/:id/deposit-refund/prepare",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  prepareRentalDepositRefund
);


// ==========================================
// CREATE PENDING RENTAL DEPOSIT REFUND
// CLERK OR STAFF ADMIN
// ==========================================

router.post(
  "/:id/deposit-refund/pending",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  createPendingRentalRefund
);


router.patch(
  "/:id/deposit-refund/:refundId/confirm",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  confirmRentalRefundPayout
);


 // ==========================================
 // FULL SECURITY DEPOSIT DEDUCTION
 // CLERK OR STAFF ADMIN
 // ==========================================

router.post(
  "/:id/deposit-deduction/full",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  settleFullRentalDepositDeduction
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
 // SETTLE RENTAL SECURITY DEPOSIT
 // CLERK OR STAFF ADMIN
 // ==========================================

router.patch(
  "/:id/deposit-settlement",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  settleRentalDeposit
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
// REVIEW DAMAGE DEPOSIT DEDUCTION
// CLERK OR STAFF ADMIN
// ==========================================

router.patch(
  "/damage-records/:damageId/deduction-review",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  reviewDamageDeduction
);


// CANCEL OWN RENTAL — CUSTOMER ONLY
router.patch(
  "/:id/cancel",
  authenticate,
  authorizeRoles("CUSTOMER"),
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