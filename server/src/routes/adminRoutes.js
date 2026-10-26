const express = require("express");

const {
  createPhotographer,
  createClerk,
  getCustomers,
  getCustomerById,
  getCustomerActivityHistory,
  updateCustomerStatus,
  deleteCustomer,
  getPhotographerApplications,
  getPhotographerApplicationById,
  getPhotographerById,
  getPhotographerBookingHistory,
  reviewPhotographerApplication,
  updateStaffAccountStatus,
  getStaffAccounts,
  getClerkById,
  getClerkWorkHistory,
} = require("../controllers/adminController");


//added by abilash
// FR-085: System activity monitoring
const {
  getActivityLogs,
} = require("../controllers/auditLogController");
//ended by abilash


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


//added by abilash
const {
  getBillingReceiptByPayment,
} = require("../controllers/billingReceiptController");
//ended by abilash


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
    getMyNotifications,
    markNotificationAsRead,
} = require("../controllers/notificationController");


const {
  getDailyRevenue,
  getMonthlyRevenue,
  getRentalReport,
  getEquipmentReport,
  getPhotographerReport,

  //added by abilash
  getRevenueTrend,
  //ended by abilash
} = require("../controllers/reportController");


const {
    getDashboardStats,
} = require("../controllers/dashboardController");

// imports by Abilash ends here

const {
  getAllSubscriptionPayments,
  getSubscriptionPaymentsForVerification,
  approveSubscriptionPayment,
  rejectSubscriptionPayment,
  viewSubscriptionPaymentReceipt,
  getPhotographersSubscriptionOverview,
} = require(
  "../controllers/photographerSubscriptionController"
);


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
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  createPhotographer
);

router.get(
  "/photographers/subscriptions",
  authenticate,
  authorizeRoles(
    "CLERK",
    "STAFF_ADMIN"
  ),
  getPhotographersSubscriptionOverview
);

// ==========================================
// GET PHOTOGRAPHER DETAILS
// CLERK AND STAFF_ADMIN
// ==========================================

router.get(
  "/photographers/:id",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getPhotographerById
);

// ==========================================
// GET PHOTOGRAPHER BOOKING HISTORY
// CLERK AND STAFF_ADMIN
// ==========================================

router.get(
  "/photographers/:id/history",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getPhotographerBookingHistory
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

 // ==========================================
 // CLERK DETAILS AND WORK HISTORY
 // STAFF ADMIN ONLY
 // ==========================================

router.get(
  "/clerks/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getClerkById
);

router.get(
  "/clerks/:id/history",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getClerkWorkHistory
);

// Abilash routes starts here

// ==========================================
// GET ALL CUSTOMERS
// GET /api/admin/customers
// ==========================================

router.get(
  "/customers",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getCustomers
);

// ==========================================
// GET CUSTOMER DETAILS BY ID
// CLERK AND ADMIN
// GET /api/admin/customers/:id
// ==========================================

router.get(
  "/customers/:id",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getCustomerById
);

// ==========================================
// GET CUSTOMER BOOKING AND RENTAL HISTORY
// ADMIN AND CLERK
// GET /api/admin/customers/:id/history
// ==========================================

router.get(
  "/customers/:id/history",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getCustomerActivityHistory
);


// ==========================================
// UPDATE CUSTOMER ACCOUNT STATUS
// ADMIN AND CLERK
// PATCH /api/admin/customers/:id/status
// ==========================================

router.patch(
  "/customers/:id/status",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  updateCustomerStatus
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
  authorizeRoles("CLERK","STAFF_ADMIN"),
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

// ==========================================
// GET ALL PAYMENTS
// GET /api/admin/payments
// STAFF_ADMIN ONLY
// ==========================================

router.get(
  "/payments",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getAllPayments
);

// ==========================================
// GET BILLING RECEIPT BY PAYMENT
// GET /api/admin/billing-receipts/payment/:paymentId
// STAFF_ADMIN ONLY
// ==========================================

router.get(
  "/billing-receipts/payment/:paymentId",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getBillingReceiptByPayment
);

// ==========================================
// RECORD SECURITY DEPOSIT
// POST /api/admin/deposits
// ==========================================

router.post(
  "/deposits",
  authenticate,
  authorizeRoles("CLERK","STAFF_ADMIN"),
  createDeposit
);

// ==========================================
// GET DEPOSITS FOR AN INVOICE
// GET /api/admin/deposits/invoice/:invoiceId
// ==========================================

router.get(
  "/deposits/invoice/:invoiceId",
  authenticate,
  authorizeRoles("CLERK","STAFF_ADMIN"),
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
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  createRefund
);

// =========================================
// GET REFUNDS FOR AN INVOICE
// GET /api/admin/refunds/invoice/:invoiceId
// =========================================

router.get(
  "/refunds/invoice/:invoiceId",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
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
 // GET MY NOTIFICATIONS - ADMIN
 // GET /api/admin/notifications
 // ==========================================

 router.get(
   "/notifications",
   authenticate,
   authorizeRoles("STAFF_ADMIN"),
   getMyNotifications
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


//added by abilash
// Revenue Analytics - Last Six Months
// GET /api/admin/reports/revenue/trend

router.get(
  "/reports/revenue/trend",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getRevenueTrend
);

//ended by abilash


router.get(
  "/reports/rentals",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getRentalReport
);

router.get(
  "/reports/equipment",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getEquipmentReport
);

router.get(
  "/reports/photographers",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getPhotographerReport
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
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getPhotographerApplications
);


router.get(
  "/photographer-applications/:id",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getPhotographerApplicationById
);


router.patch(
  "/photographer-applications/:id/status",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  reviewPhotographerApplication
);

// ==========================================
// ENABLE / DISABLE CLERK OR PHOTOGRAPHER
// STAFF_ADMIN ONLY
// ==========================================

router.patch(
  "/users/:userId/status",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  updateStaffAccountStatus
);

// ==========================================
// GET CLERK / PHOTOGRAPHER ACCOUNTS
// STAFF_ADMIN ONLY
// ==========================================

router.get(
  "/staff-accounts",
  authenticate,
  authorizeRoles("CLERK", "STAFF_ADMIN"),
  getStaffAccounts
);

// ==========================================
// GET ALL SUBSCRIPTION PAYMENTS
// STAFF_ADMIN ONLY
// ==========================================

router.get(
  "/subscription-payments",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getAllSubscriptionPayments
);

router.get(
  "/subscription-payments/verification",
  authenticate,
  authorizeRoles(
    "CLERK",
    "STAFF_ADMIN"
  ),
  getSubscriptionPaymentsForVerification
);

router.patch(
  "/subscription-payments/:paymentId/approve",
  authenticate,
  authorizeRoles(
    "CLERK",
    "STAFF_ADMIN"
  ),
  approveSubscriptionPayment
);

router.patch(
  "/subscription-payments/:paymentId/reject",
  authenticate,
  authorizeRoles(
    "CLERK",
    "STAFF_ADMIN"
  ),
  rejectSubscriptionPayment
);

router.get(
  "/subscription-payments/:paymentId/receipt",
  authenticate,
  authorizeRoles(
    "CLERK",
    "STAFF_ADMIN"
  ),
  viewSubscriptionPaymentReceipt
);

router.get(
  "/clerk/notifications",
  authenticate,
  authorizeRoles("CLERK"),
  getMyNotifications
);

router.patch(
  "/clerk/notifications/:notificationId/read",
  authenticate,
  authorizeRoles("CLERK"),
  markNotificationAsRead
);

// ==========================================
// DELETE CUSTOMER ACCOUNT - ADMIN ONLY
// ==========================================
router.delete(
  "/customers/:id",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  deleteCustomer
);

//added by abilash
// FR-085: Admin can monitor system activities
router.get(
  "/activity-logs",
  authenticate,
  authorizeRoles("STAFF_ADMIN"),
  getActivityLogs
);
//ended by abilash



module.exports = router;