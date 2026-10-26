const mongoose = require("mongoose");
const fs = require("fs/promises");

const Payment = require("../models/payment");
const Invoice = require("../models/invoice");
const Rental = require("../models/Rental");
const Deposit = require("../models/deposit");

const validatePaymentReceipt = require(
  "../utils/validatePaymentReceipt"
);
const {
  updateInvoicePaymentStatus,
} = require("./paymentController");

// ============================================================
// CUSTOMER SUBMIT RENTAL PAYMENT RECEIPT
// POST /api/customer/rental-payments/submit
// ============================================================

const submitRentalPaymentReceipt = async (req, res, next) => {
  const removeUploadedFile = async () => {
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (error) {
        console.error("Receipt cleanup failed:", error);
      }
    }
  };

  const rejectSubmission = async (status, message) => {
    await removeUploadedFile();

    return res.status(status).json({
      success: false,
      message,
    });
  };

  try {
    const { invoiceId, paymentReference } = req.body;
    const customerId = req.user.userId;

    // 1. Validate invoice ID.
    if (!mongoose.isValidObjectId(invoiceId)) {
      return await rejectSubmission(
        400,
        "Invalid invoice ID."
      );
    }

    // 2. Validate payment reference.
    const reference =
      typeof paymentReference === "string"
        ? paymentReference.trim()
        : "";

    if (!reference || reference.length > 100) {
      return await rejectSubmission(
        400,
        "A valid payment reference is required."
      );
    }

    // 3. Require an uploaded receipt.
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Payment receipt is required.",
      });
    }

    // 4. Validate the uploaded file content.
    const validReceipt = await validatePaymentReceipt(req.file);

    if (!validReceipt) {
      return await rejectSubmission(
        400,
        "Invalid receipt file. Upload a valid JPG, PNG, or PDF."
      );
    }

    // 5. Find an invoice belonging to this customer.
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      customer: customerId,
      rental: { $ne: null },
    });

    if (!invoice) {
      return await rejectSubmission(
        404,
        "Rental invoice not found."
      );
    }

    // 6. Verify the rental is confirmed.
    const rental = await Rental.findOne({
      _id: invoice.rental,
      customer: customerId,
      status: "CONFIRMED",
    });

    if (!rental) {
      return await rejectSubmission(
        400,
        "Only confirmed rental invoices can receive payment receipts."
      );
    }

    // 7. Prevent another pending submission.
    const existingPendingPayment = await Payment.findOne({
      invoice: invoice._id,
      paymentStatus: "PENDING_VERIFICATION",
    });

    if (existingPendingPayment) {
      return await rejectSubmission(
        409,
        "A payment receipt is already awaiting verification."
      );
    }

    // 8. Calculate remaining invoice balance.
    const completedPayments = await Payment.find({
      invoice: invoice._id,
      paymentStatus: "COMPLETED",
    });

    const totalPaid = completedPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const remainingBalance = Number(
      (invoice.totalAmount - totalPaid).toFixed(2)
    );

    if (
      !Number.isFinite(remainingBalance) ||
      remainingBalance <= 0
    ) {
      return await rejectSubmission(
        400,
        "This invoice has already been fully paid."
      );
    }

    // 9. Create payment awaiting Clerk verification.
    const payment = await Payment.create({
      invoice: invoice._id,
      customer: customerId,
      amount: remainingBalance,
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PENDING_VERIFICATION",
      paymentReference: reference,
      receiptUrl: req.file.filename,
      submittedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Payment receipt submitted for Clerk verification.",
      data: {
        payment,
      },
    });
  } catch (error) {
    await removeUploadedFile();
    next(error);
  }
};

// ==========================================
// APPROVE RENTAL PAYMENT
// CLERK OR STAFF_ADMIN
// ==========================================

const approveRentalPayment = async (req, res, next) => {
  const { paymentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment ID",
    });
  }

  const session = await mongoose.startSession();

  try {
    let approvedPayment;
    let invoiceSummary;

    await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        _id: paymentId,
        paymentStatus: "PENDING_VERIFICATION",
      }).session(session);

      if (!payment) {
        const error = new Error(
          "Payment not found or already verified/rejected."
        );
        error.statusCode = 409;
        throw error;
      }

      const invoice = await Invoice.findById(
        payment.invoice
      ).session(session);

      if (!invoice) {
        const error = new Error("Invoice not found");
        error.statusCode = 404;
        throw error;
      }

      // Write to the invoice to serialize approvals
      // for payments belonging to the same invoice.
      const lockedInvoice = await Invoice.findOneAndUpdate(
        { _id: invoice._id },
        { $set: { paymentStatus: invoice.paymentStatus } },
        { session, new: true }
      );

      if (!lockedInvoice) {
        const error = new Error("Invoice not found");
        error.statusCode = 404;
        throw error;
      }

      const completedPayments = await Payment.find({
        invoice: invoice._id,
        paymentStatus: "COMPLETED",
      }).session(session);

      const totalPaid = completedPayments.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      const remainingBalance =
        invoice.totalAmount - totalPaid;

      if (
        remainingBalance <= 0 ||
        payment.amount <= 0 ||
        payment.amount > remainingBalance + 0.001
      ) {
        const error = new Error(
          "Payment amount exceeds the outstanding invoice balance."
        );
        error.statusCode = 409;
        throw error;
      }

      payment.paymentStatus = "COMPLETED";
      payment.verifiedBy = req.user.userId;
      payment.verifiedAt = new Date();
      payment.rejectionReason = null;

      await payment.save({ session });

      const newTotalPaid = totalPaid + payment.amount;

      if (newTotalPaid >= invoice.totalAmount - 0.001) {
        lockedInvoice.paymentStatus = "PAID";
      } else {
        lockedInvoice.paymentStatus = "PARTIALLY_PAID";
      }

    await lockedInvoice.save({ session });

    // ============================================================
    // AUTOMATICALLY RECORD VERIFIED RENTAL SECURITY DEPOSIT
    // ============================================================

    // Only record a deposit for a fully paid rental invoice.
    if (
    lockedInvoice.paymentStatus === "PAID" &&
    lockedInvoice.rental &&
    Number(lockedInvoice.securityDeposit) > 0
    ) {
    const existingDeposit = await Deposit.findOne({
        invoice: lockedInvoice._id,
    }).session(session);

    if (!existingDeposit) {
        await Deposit.create(
        [
            {
            invoice: lockedInvoice._id,
            customer: lockedInvoice.customer,
            amount: Number(lockedInvoice.securityDeposit),
            status: "HELD",
            },
        ],
        { session }
        );
    } else if (
        existingDeposit.status === "PENDING" &&
        Number(existingDeposit.amount) ===
        Number(lockedInvoice.securityDeposit)
    ) {
        existingDeposit.status = "HELD";
        await existingDeposit.save({ session });
    } else if (
        existingDeposit.status !== "HELD" ||
        Number(existingDeposit.amount) !==
        Number(lockedInvoice.securityDeposit)
    ) {
        const error = new Error(
        "Security deposit record requires review before payment approval."
        );
        error.statusCode = 409;
        throw error;
    }
    }

    approvedPayment = payment.toObject();

      invoiceSummary = {
        paymentStatus: lockedInvoice.paymentStatus,
        totalPaid: newTotalPaid,
        totalAmount: invoice.totalAmount,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Rental payment approved successfully",
      data: {
        payment: approvedPayment,
        invoice: invoiceSummary,
      },
    });
  } catch (error) {
    if (error.hasErrorLabel?.("TransientTransactionError")) {
      return res.status(409).json({
        success: false,
        message:
          "Payment verification conflicted with another update. Please retry.",
      });
    }

    if (error.statusCode) {
    return res.status(error.statusCode).json({
        success: false,
        message: error.message,
    });
    }

    next(error);

  } finally {
    await session.endSession();
  }
};


 // ==========================================
 // REJECT RENTAL PAYMENT RECEIPT
 // CLERK OR STAFF_ADMIN
 // ==========================================

const rejectRentalPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;

    // Validate payment ID
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    // Validate rejection reason
    if (
      typeof rejectionReason !== "string" ||
      !rejectionReason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const reason = rejectionReason.trim();

    if (reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason cannot exceed 500 characters",
      });
    }

    // Only pending payments can be rejected.
    // Atomic update prevents duplicate decisions.
    const payment = await Payment.findOneAndUpdate(
      {
        _id: paymentId,
        paymentStatus: "PENDING_VERIFICATION",
      },
      {
        $set: {
          paymentStatus: "REJECTED",
          rejectionReason: reason,
          verifiedBy: req.user.userId,
          verifiedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!payment) {
      return res.status(409).json({
        success: false,
        message:
          "Payment not found or already approved/rejected",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rental payment rejected successfully",
      data: {
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET PENDING RENTAL PAYMENTS
// CLERK OR STAFF_ADMIN
// ==========================================

const getPendingRentalPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      paymentStatus: "PENDING_VERIFICATION",
      receiptUrl: { $exists: true, $nin: [null, ""] },
    })
      .populate("customer", "name email")
      .populate(
        "invoice",
        "invoiceNumber rental totalAmount paymentStatus"
      )
      .sort({ submittedAt: 1 });

    // Include only rental-related payments.
    const rentalPayments = payments.filter(
      (payment) => payment.invoice?.rental
    );

    return res.status(200).json({
      success: true,
      message: "Pending rental payments retrieved successfully",
      data: {
        payments: rentalPayments,
        count: rentalPayments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};


const path = require("path");


 // ============================================================
 // GET RENTAL PAYMENT HISTORY
 // CLERK OR STAFF_ADMIN
 // GET /api/rentals/payments/history
 // ============================================================

const getRentalPaymentHistory = async (req, res, next) => {
  try {
    const allowedStatuses = [
      "PENDING_VERIFICATION",
      "COMPLETED",
      "REJECTED",
    ];

    const requestedStatus = req.query.status;

    // Validate optional status filter.
    if (
      requestedStatus !== undefined &&
      !allowedStatuses.includes(requestedStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status filter.",
      });
    }

    const filter = {
      paymentStatus: requestedStatus
        ? requestedStatus
        : { $in: allowedStatuses },

      receiptUrl: {
        $exists: true,
        $nin: [null, ""],
      },

      paymentMethod: "BANK_TRANSFER",
    };

    const payments = await Payment.find(filter)
      .populate("customer", "name email")
      .populate(
        "invoice",
        "invoiceNumber rental totalAmount paymentStatus"
      )
      .populate("verifiedBy", "name email")
      .sort({
        submittedAt: -1,
        createdAt: -1,
      });

    // Exclude non-rental payments.
    const rentalPayments = payments.filter(
      (payment) => payment.invoice?.rental
    );

    const counts = {
      all: rentalPayments.length,
      pending: rentalPayments.filter(
        (payment) =>
          payment.paymentStatus === "PENDING_VERIFICATION"
      ).length,
      approved: rentalPayments.filter(
        (payment) =>
          payment.paymentStatus === "COMPLETED"
      ).length,
      rejected: rentalPayments.filter(
        (payment) =>
          payment.paymentStatus === "REJECTED"
      ).length,
    };

    return res.status(200).json({
      success: true,
      message: "Rental payment history retrieved successfully.",
      data: {
        payments: rentalPayments,
        count: rentalPayments.length,
        counts,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// VIEW RENTAL PAYMENT RECEIPT
// CLERK OR STAFF_ADMIN
// ==========================================

const viewRentalPaymentReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate("invoice", "rental");

    if (!payment || !payment.invoice?.rental) {
      return res.status(404).json({
        success: false,
        message: "Rental payment not found",
      });
    }

    if (!payment.receiptUrl) {
      return res.status(404).json({
        success: false,
        message: "Payment receipt not found",
      });
    }

    // Allow only a filename, never a directory path.
    const filename = payment.receiptUrl;

    if (
      filename !== path.basename(filename) ||
      !/^rental-payment-[a-f0-9-]+\.(jpg|jpeg|png|pdf)$/i.test(filename)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid receipt filename",
      });
    }

    const receiptDirectory = path.resolve(
      process.cwd(),
      "uploads",
      "rental-payment-receipts"
    );

    const receiptPath = path.join(
      receiptDirectory,
      filename
    );

    // Prevent browsers and proxies from caching receipts.
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(receiptPath, {
      dotfiles: "deny",
      headers: {
        "Content-Disposition": "inline",
      },
    }, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitRentalPaymentReceipt,
  approveRentalPayment,
  rejectRentalPayment,
  getPendingRentalPayments,
  getRentalPaymentHistory,
  viewRentalPaymentReceipt
};