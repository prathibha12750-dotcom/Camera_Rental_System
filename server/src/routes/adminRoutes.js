const express = require("express");

const {
  createPhotographer,
  createClerk,
  getCustomers, //imported by abilash
  getPhotographerApplications,
  getPhotographerApplicationById,
  reviewPhotographerApplication,
} = require("../controllers/adminController");


// imports by Abilash starts here

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
} = require("../controllers/invoiceController");

const {
    createPayment,
    getPaymentsByInvoice,
    getAllPayments,
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

const {
    createNotification,
    getNotificationByUser,
    markNotificationAsRead,
} = require("../controllers/notificationController");

const {
  getDailyRevenue,
  getMonthlyRevenue
} = require("../controllers/reportController");

const {
    getDashboardStats,
} = require("../controllers/dashboardController");

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

// ==========================================
// CREATE CLERK ACCOUNT
// STAFF_ADMIN ONLY
// ==========================================

router.post(
  "/clerks",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createClerk
);  


// Abilash routes starts here

// ==========================================
// GET ALL CUSTOMERS
// GET /api/admin/customers
// ==========================================

router.get(
  "/customers",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getCustomers
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
// GET /api/admin/payments/invoice/:invoiceId
// ===========================================

router.get(
  "/payments/invoice/:invoiceId",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getPaymentsByInvoice
);

// ===========================================
// GET ALL PAYMENTS
// GET /api/admin/payments
// STAFF_ADMIN ONLY
// ===========================================

router.get(
  "/payments",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getAllPayments
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
// GET /api/admin/deposits/:depositId
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

// ==========================================
// CREATE NOTIFICATION
// POST /api/admin/notification
// ==========================================

router.post(
  "/notifications",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  createNotification
);

// ==========================================
// GET USER NOTIFICATION
// POST /api/admin/notification/user/:userId
// ==========================================

router.get(
  "/notifications/user/:userId",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getNotificationByUser
);

// ==================================================
// MARK NOTIFICATION AS READ
// POST /api/admin/notification/:notificationId/read
// ==================================================

router.patch(
  "/notifications/:notificationId/read",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  markNotificationAsRead
);

// ==================================================
// DAILY REVENUE REPORT
// GET /api/admin/reports/revenue/daily
// ==================================================

router.get(
  "/reports/revenue/daily",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getDailyRevenue
);

// ==========================================
// MONTHLY REVENUE REPORT
// GET /api/admin/reports/revenue/monthly
// ==========================================

router.get(
    "/reports/revenue/monthly",
    authenticate,
    authorizeRoles("STAFF_ADMIN"),
    getMonthlyRevenue
);

// ==========================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// ==========================================

router.get(
    "/dashboard",
    authenticate,
    authorizeRoles("STAFF_ADMIN"),
    getDashboardStats
);


// Abilash routes ends here

// ==========================================
// PHOTOGRAPHER APPLICATIONS
// ==========================================

router.get(
  "/photographer-applications",
  authenticate,
  authorizeRoles(
    "STAFF_ADMIN"
  ),
  getPhotographerApplications
);


router.get(
  "/photographer-applications/:id",
  authenticate,
  authorizeRoles(
    "STAFF_ADMIN"
  ),
  getPhotographerApplicationById
);


router.patch(
  "/photographer-applications/:id/status",
  authenticate,
  authorizeRoles(
    "STAFF_ADMIN"
  ),
  reviewPhotographerApplication
);


module.exports = router;