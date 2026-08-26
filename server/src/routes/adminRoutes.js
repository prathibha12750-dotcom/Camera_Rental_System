const express = require("express");

const {
  createPhotographer,
} = require("../controllers/adminController");

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
} = require("../controllers/invoiceController");

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

module.exports = router;