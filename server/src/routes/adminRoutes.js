const express = require("express");

const {
  createPhotographer,
} = require("../controllers/adminController");


// imports by Abilash starts here

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
} = require("../controllers/invoiceController");

const {
  createPayment,
  getPaymentsByInvoice
} = require("../controllers/paymentController");

const {
  createDeposit,
  getDepositByInvoice,
  getDepositById,
} = require("../controllers/depositController");

const {
  createRefund,
  getRefundById,
  getRefundsByInvoice
} = require("../controllers/refundController");

// imports by Abilash ends here


const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();


// ==========================================
// ADMIN TEST ROUTE
// ==========================================

router.get(
  "/test",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Staff/Admin authorization successful",
      user: req.user,
    });
  }
);


// ==========================================
// CREATE PHOTOGRAPHER
// ==========================================

router.post(
  "/photographers",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createPhotographer
);

// Abilash routes starts here

// ==========================================
// CREATE INVOICE
// POST /api/admin/invoices
// ==========================================

router.post(
  "/invoices",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createInvoice
);

// ==========================================
// GET ALL INVOICES
// GET /api/admin/invoices
// ==========================================

router.get(
  "/invoices",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getInvoices
);

// ==========================================
// GET SINGLE INVOICE
// GET /api/admin/invoices/:id
// ==========================================

router.get(
  "/invoices/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getInvoiceById
);

// ===========================================
// CREATE PAYMENT
// POST /api/admin/payments
// ===========================================

router.post(
  "/payments",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createPayment
);

// ===========================================
// GET PAYMENTS FOR AN INVOICE
// GET /api/admi/payments/invoice/:invoiceId
// ===========================================

router.get(
  "/payments/invoice/:invoiceId",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getPaymentsByInvoice
);

// ==========================================
// RECORD SECURITY DEPOSIT
// POST /api/admin/deposits
// ==========================================

router.post(
  "/deposits",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createDeposit
);

// ==========================================
// GET DEPOSITS FOR AN INVOICE
// GET /api/admin/deposits/invoice/:invoiceId
// ==========================================

router.get(
  "/deposits/invoice/:invoiceId",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getDepositByInvoice
);

// ==========================================
// GET SINGLE DEPOSIT
// GET /aoi/admin/deposits/:depositId
// ==========================================

router.get(
  "/deposits/:depositId",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getDepositById
);

// =========================================
// CREATE REFUND
// POST /api/admin/refunds
// =========================================

router.post(
  "/refunds",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createRefund
);

// =========================================
// GET REFUNDS FOR AN INVOICE
// GET /api/admin/refunds/invoice/:invoiceId
// =========================================

router.get(
  "/refunds/invoice/:invoiceId",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getRefundsByInvoice
);


// ========================================
// GET SINGLE REFUND
// GET /api/admin/refunds/:refundId
// ========================================

router.get(
  "/refunds/:refundId",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getRefundById
);


// Abilash routes ends here

module.exports = router;