
const mongoose = require("mongoose");

const Deposit = require("../models/deposit");
const Invoice = require("../models/invoice");
const User = require("../models/User");

//added by abilash
const PhotographerNotification = require("../models/photographerNotification");
//ended by abilash


 //added by abilash
// FR-085: System activity audit logging
const { logActivity } = require("../services/auditLogService");
//ended by abilash


// ==========================================
// RECORD SECURITY DEPOSIT
// POST /api/admin/deposits
// ==========================================

const createDeposit = async (req, res, next) => {

  try {
    const { invoice, amount } = req.body;

    // ==========================================
    // 1. VALIDATE INVOICE ID
    // ==========================================

    if (!invoice) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    if (
      typeof invoice !== "string" ||
      !mongoose.isValidObjectId(invoice)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    // ==========================================
    // 2. VALIDATE DEPOSIT AMOUNT
    // ==========================================

    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Deposit amount is required",
      });
    }

    if (
      typeof amount !== "number" &&
      typeof amount !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit amount",
      });
    }

    const depositAmount = Number(amount);

    if (
      !Number.isFinite(depositAmount) ||
      depositAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Deposit amount must be a valid number greater than zero",
      });
    }

    if (
      !Number.isInteger(
        Math.round(depositAmount * 100)
      ) ||
      Math.abs(
        depositAmount * 100 -
          Math.round(depositAmount * 100)
      ) > 0.000001
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Deposit amount cannot have more than two decimal places",
      });
    }

    // ==========================================
    // 3. FIND INVOICE
    // ==========================================

    const existingInvoice = await Invoice.findById(
      invoice
    );

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // ==========================================
    // 4. VALIDATE REQUIRED SECURITY DEPOSIT
    // ==========================================

    const requiredDeposit = Number(
      existingInvoice.securityDeposit
    );

    if (
      !Number.isFinite(requiredDeposit) ||
      requiredDeposit <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This invoice does not require a security deposit",
      });
    }

    if (depositAmount > requiredDeposit) {
      return res.status(400).json({
        success: false,
        message:
          "Deposit amount cannot exceed the required security deposit",
      });
    }

    // ==========================================
    // 5. CHECK EXISTING DEPOSIT
    // ==========================================

    // IMPORTANT:
    // Do not filter by status.
    //
    // A deposit still exists after it becomes:
    // REFUND_PENDING, REFUNDED,
    // PARTIALLY_REFUNDED, or DEDUCTED.

    const existingDeposit = await Deposit.findOne({
      invoice: existingInvoice._id,
    });

    if (existingDeposit) {
      return res.status(409).json({
        success: false,
        message:
          "A security deposit has already been recorded for this invoice. Another deposit cannot be created.",
      });
    }

    // ==========================================
    // 6. FIND CUSTOMER
    // ==========================================

    const customer = await User.findById(
      existingInvoice.customer
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // ==========================================
    // 7. CREATE DEPOSIT
    // ==========================================

    // A unique database index on Deposit.invoice
    // is also required to prevent simultaneous
    // requests from creating duplicate deposits.

    const deposit = await Deposit.create({
      invoice: existingInvoice._id,
      customer: customer._id,
      amount: depositAmount,
      status: "HELD",
    });

    // ==========================================
    // FR-150: NOTIFY CUSTOMER
    // ==========================================

    try {
      await PhotographerNotification.create({
        user: customer._id,
        title: "Security Deposit Recorded",
        message:
          `Your security deposit of LKR ${deposit.amount} ` +
          `has been recorded for invoice ${existingInvoice.invoiceNumber}.`,
        type: "DEPOSIT_RECORDED",
        read: false,
      });
    } catch (notificationError) {
      // A notification failure must not undo a saved deposit.
      console.error(
        "Failed to create deposit notification:",
        notificationError
      );
    }

    // ==========================================
    // FR-085: RECORD DEPOSIT ACTIVITY
    // ==========================================

    try {
      await logActivity({
        actor: req.user.userId,
        actorRole: req.user.role || "STAFF_ADMIN",
        action: "DEPOSIT_RECORDED",
        entityType: "Deposit",
        entityId: deposit._id,
        outcome: "SUCCESS",
        message:
          `Security deposit recorded for invoice ${existingInvoice.invoiceNumber}`,
      });
    } catch (auditError) {
      // The deposit has already been saved.
      // Audit logging failure must not cause a duplicate retry.
      console.error(
        "Failed to record deposit audit activity:",
        auditError
      );
    }

    // ==========================================
    // 8. SUCCESS RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message:
        "Security deposit recorded successfully",
      data: {
        deposit,
      },
    });
  } catch (error) {
    // ==========================================
    // DUPLICATE KEY ERROR
    // ==========================================

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A security deposit already exists for this invoice.",
      });
    }

    next(error);
  }
};

// ==========================================
// GET DEPOSITS FOR AN INVOICE
// GET /api/admin/deposits/invoice/:invoiceId
// ==========================================

const getDepositByInvoice = async (
  req,
  res,
  next
) => {
  try {
    const { invoiceId } = req.params;

    if (!mongoose.isValidObjectId(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    const deposits = await Deposit.find({
      invoice: invoiceId,
    })
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message:
        "Deposits retrieved successfully",
      data: {
        deposits,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET SINGLE DEPOSIT
// GET /api/admin/deposits/:depositId
// ==========================================

const getDepositById = async (
  req,
  res,
  next
) => {
  try {
    const { depositId } = req.params;

    if (!mongoose.isValidObjectId(depositId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit ID",
      });
    }

    const deposit = await Deposit.findById(
      depositId
    )
      .populate("customer", "name email")
      .populate(
        "invoice",
        "invoiceNumber serviceDetails securityDeposit"
      );

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deposit retrieved successfully",
      data: {
        deposit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createDeposit,
  getDepositByInvoice,
  getDepositById,
};