
const mongoose = require("mongoose");

const Rental = require("../models/Rental");
const Return = require("../models/Return");
const DamageRecord = require("../models/DamageRecord");
const Invoice = require("../models/invoice");
const Deposit = require("../models/deposit");
const Refund = require("../models/refund");


 // ==========================================
 // REFUND METHOD VALIDATION
 // ==========================================

const VALID_REFUND_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CARD",
];

const isValidRefundMethod = (method) => {
  return VALID_REFUND_METHODS.includes(method);
};

 // ==========================================
 // VALIDATE OVERDUE PENALTY REVIEW
 // BEFORE DEPOSIT SETTLEMENT
 // ==========================================

const validateOverduePenaltyReview = (rental) => {
  const status =
    rental.overduePenaltyStatus || "NOT_APPLICABLE";

  if (status === "PENDING_REVIEW") {
    const error = new Error(
      "Overdue penalty must be approved or rejected before deposit settlement"
    );

    error.statusCode = 409;
    throw error;
  }

  // APPROVED penalties will be included in
  // the deposit deduction calculation later.
  //
  // REJECTED and NOT_APPLICABLE penalties
  // do not create deductions.

  if (
    ![
      "NOT_APPLICABLE",
      "APPROVED",
      "REJECTED",
      "SETTLED",
    ].includes(status)
  ) {
    const error = new Error(
      "Invalid overdue penalty review status"
    );

    error.statusCode = 409;
    throw error;
  }

  return true;
};

 // ==========================================
 // GET APPROVED OVERDUE PENALTY AMOUNT
 // ==========================================

const getApprovedOverduePenalty = (rental) => {
  validateOverduePenaltyReview(rental);

  if (rental.overduePenaltyStatus !== "APPROVED") {
    return 0;
  }

  const amount = rental.overduePenaltyAmount;

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    const error = new Error(
      "Approved overdue penalty amount is invalid"
    );

    error.statusCode = 409;
    throw error;
  }

  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

 // ==========================================
 // ALLOCATE SECURITY DEPOSIT DEDUCTIONS
 // DAMAGE FIRST, THEN OVERDUE PENALTY
 // ==========================================

const calculateDepositDeductionAllocation = ({
  depositAmount,
  approvedDamageDeduction,
  approvedOverduePenalty,
}) => {
  const roundCurrency = (value) =>
    Math.round((value + Number.EPSILON) * 100) / 100;

  const deposit = Number(depositAmount);
  const damage = Number(approvedDamageDeduction);
  const overdue = Number(approvedOverduePenalty);

  if (
    ![deposit, damage, overdue].every(Number.isFinite) ||
    deposit < 0 ||
    damage < 0 ||
    overdue < 0
  ) {
    const error = new Error(
      "Invalid deposit deduction allocation amounts"
    );
    error.statusCode = 409;
    throw error;
  }

  // Allocate the deposit to approved damage first.
  const damageRecovered = roundCurrency(
    Math.min(deposit, damage)
  );

  // Allocate the remaining deposit to overdue penalties.
  const remainingDeposit = roundCurrency(
    Math.max(0, deposit - damageRecovered)
  );

  const overduePenaltyRecovered = roundCurrency(
    Math.min(remainingDeposit, overdue)
  );

  const overduePenaltyOutstanding = roundCurrency(
    Math.max(0, overdue - overduePenaltyRecovered)
  );

  const damageOutstanding = roundCurrency(
    Math.max(0, damage - damageRecovered)
  );

  const totalDeduction = roundCurrency(
    damageRecovered + overduePenaltyRecovered
  );

  const refundableAmount = roundCurrency(
    Math.max(0, deposit - totalDeduction)
  );

  return {
    damageRecovered,
    damageOutstanding,
    overduePenaltyRecovered,
    overduePenaltyOutstanding,
    totalDeduction,
    refundableAmount,
  };
};

const validateOverduePenaltyAllocation = ({
  approvedOverduePenalty,
  overduePenaltyRecovered,
  overduePenaltyOutstanding,
}) => {
  const roundCurrency = (value) =>
    Math.round((value + Number.EPSILON) * 100) / 100;

  const approved = Number(approvedOverduePenalty);
  const recovered = Number(overduePenaltyRecovered);
  const outstanding = Number(overduePenaltyOutstanding);

  const amountsAreValid = [approved, recovered, outstanding].every(
    (amount) => Number.isFinite(amount) && amount >= 0
  );

  if (!amountsAreValid) {
    const error = new Error(
      "Invalid overdue penalty recovery amounts"
    );
    error.statusCode = 409;
    throw error;
  }

  const totalAccounted = roundCurrency(
    recovered + outstanding
  );

  if (
    Math.abs(totalAccounted - roundCurrency(approved)) > 0.001
  ) {
    const error = new Error(
      "Overdue penalty recovery does not match the approved penalty"
    );
    error.statusCode = 409;
    throw error;
  }

  return true;
};

const validateOverduePenaltySettlementStatus = (rental) => {
  const status = rental.overduePenaltyStatus;

  if (!["APPROVED", "SETTLED"].includes(status)) {
    return true;
  }

  const recovered = Number(
    rental.overduePenaltyRecoveredAmount
  );

  const outstanding = Number(
    rental.overduePenaltyOutstandingAmount
  );

  const approved = Number(rental.overduePenaltyAmount);

  // Validate recorded recovery amounts.
  validateOverduePenaltyAllocation({
    approvedOverduePenalty: approved,
    overduePenaltyRecovered: recovered,
    overduePenaltyOutstanding: outstanding,
  });

  // SETTLED means the entire penalty has been recovered.
  if (status === "SETTLED" && outstanding !== 0) {
    const error = new Error(
      "Settled overdue penalty cannot have an outstanding balance"
    );

    error.statusCode = 409;
    throw error;
  }

  // A fully recovered penalty must be marked SETTLED.
  if (
    status === "APPROVED" &&
    approved > 0 &&
    recovered === approved &&
    outstanding === 0
  ) {
    const error = new Error(
      "Fully recovered overdue penalty must be marked SETTLED"
    );

    error.statusCode = 409;
    throw error;
  }

  return true;
};

// ==========================================
// SETTLE RENTAL SECURITY DEPOSIT
// INITIAL VALIDATION / PREVIEW
// ==========================================

const settleRentalDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID",
      });
    }

    const rental = await Rental.findById(id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    if (rental.status !== "RETURNED") {
      return res.status(409).json({
        success: false,
        message: "Rental must be returned before deposit settlement",
      });
    }

    // ==========================================
    // VERIFY OVERDUE PENALTY REVIEW
    // ==========================================

    validateOverduePenaltyReview(rental);

    const returnRecord = await Return.findOne({
      rental: rental._id,
    });

    if (!returnRecord) {
      return res.status(409).json({
        success: false,
        message: "Return record not found",
      });
    }

    const invoice = await Invoice.findOne({
      rental: rental._id,
    });

    if (!invoice || invoice.paymentStatus !== "PAID") {
      return res.status(409).json({
        success: false,
        message: "Rental invoice must be fully paid",
      });
    }

    const deposit = await Deposit.findOne({
      invoice: invoice._id,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Security deposit record not found",
      });
    }

    if (!["HELD", "REFUND_PENDING"].includes(deposit.status)) {
      return res.status(409).json({
        success: false,
        message: "Security deposit is not available for settlement",
      });
    }

    const damageRecords = await DamageRecord.find({
      rental: rental._id,
    });

    const unfinishedDamage = damageRecords.find(
      (damage) => damage.status !== "RESOLVED"
    );

    if (unfinishedDamage) {
      return res.status(409).json({
        success: false,
        message:
          "All damage assessments must be resolved before settlement",
      });
    }

    if (
      returnRecord.condition === "DAMAGED" &&
      damageRecords.length === 0
    ) {
      return res.status(409).json({
        success: false,
        message: "Damaged return requires a damage assessment",
      });
    }

    const totalRepairCost = damageRecords.reduce(
      (total, damage) => total + Number(damage.repairCost || 0),
      0
    );

    const depositAmount = Number(deposit.amount);

    const unreviewedDamage = damageRecords.find(
      (damage) =>
        !["APPROVED", "REJECTED"].includes(
          damage.deductionApprovalStatus
        )
    );

    if (unreviewedDamage) {
      return res.status(409).json({
        success: false,
        message:
          "All damage deductions must be reviewed before settlement",
      });
    }

    const invalidApproval = damageRecords.some((damage) => {
      const repairCost = Number(damage.repairCost);
      const approved = Number(damage.approvedDeductionAmount);

      return (
        !Number.isFinite(repairCost) ||
        repairCost < 0 ||
        !Number.isFinite(approved) ||
        approved < 0 ||
        approved > repairCost ||
        (damage.deductionApprovalStatus === "REJECTED" &&
          approved !== 0)
      );
    });

    if (invalidApproval) {
      return res.status(409).json({
        success: false,
        message: "Invalid approved damage deduction",
      });
    }

    // ==========================================
    // CALCULATE APPROVED DAMAGE DEDUCTIONS
    // ==========================================

    const totalApprovedDamageDeduction = damageRecords.reduce(
      (total, damage) =>
        total +
        (damage.deductionApprovalStatus === "APPROVED"
          ? Number(damage.approvedDeductionAmount)
          : 0),
      0
    );

    // ==========================================
    // INCLUDE APPROVED OVERDUE PENALTY
    // ==========================================

    const approvedOverduePenalty =
      getApprovedOverduePenalty(rental);

    const totalApprovedDeduction =
      Math.round(
        (
          totalApprovedDamageDeduction +
          approvedOverduePenalty +
          Number.EPSILON
        ) * 100
      ) / 100;

    // ==========================================
    // ALLOCATE SECURITY DEPOSIT
    // DAMAGE FIRST, THEN OVERDUE PENALTY
    // ==========================================

    const allocation = calculateDepositDeductionAllocation({
      depositAmount,
      approvedDamageDeduction: totalApprovedDamageDeduction,
      approvedOverduePenalty,
    });

    const deductedAmount = allocation.totalDeduction;
    const refundableAmount = allocation.refundableAmount;

    return res.status(200).json({
      success: true,
      message: "Deposit settlement preview calculated",
      data: {
        rentalId: rental._id,
        invoiceId: invoice._id,
        depositId: deposit._id,
        depositStatus: deposit.status,
        depositAmount,
        totalRepairCost,
        totalApprovedDamageDeduction,
        approvedOverduePenalty,
        totalApprovedDeduction,
        deductedAmount,
        refundableAmount,
        damageRecovered: allocation.damageRecovered,
        damageOutstanding: allocation.damageOutstanding,
        overduePenaltyRecovered:
          allocation.overduePenaltyRecovered,
        overduePenaltyOutstanding:
          allocation.overduePenaltyOutstanding,
        refundRequired: refundableAmount > 0,
        settlementStatus: "PREVIEW_ONLY",
      },
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }

};


 // ==========================================
 // PREPARE RENTAL DEPOSIT REFUND
 // INITIAL REQUEST VALIDATION
 // ==========================================

const prepareRentalDepositRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refundMethod } = req.body;

    // Validate rental ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID",
      });
    }

    // Validate refund method
    if (!isValidRefundMethod(refundMethod)) {
      return res.status(400).json({
        success: false,
        message:
          "Refund method must be CASH, BANK_TRANSFER, or CARD",
      });
    }

    // ==========================================
    // VALIDATE RENTAL ELIGIBILITY
    // ==========================================

    // Check that the rental exists.
    const rental = await Rental.findById(id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    // Only returned rentals can proceed.
    if (rental.status !== "RETURNED") {
      return res.status(409).json({
        success: false,
        message:
          "Rental must be returned before preparing a deposit refund",
      });
    }

    // ==========================================
    // VERIFY OVERDUE PENALTY REVIEW
    // ==========================================

    validateOverduePenaltyReview(rental);

    // Confirm the equipment return was recorded.
    const returnRecord = await Return.findOne({
      rental: rental._id,
    });

    if (!returnRecord) {
      return res.status(409).json({
        success: false,
        message: "Equipment return record not found",
      });
    }

    // ==========================================
    // VALIDATE RENTAL INVOICE
    // ==========================================

    const invoice = await Invoice.findOne({
      rental: rental._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Rental invoice not found",
      });
    }

    if (invoice.paymentStatus !== "PAID") {
      return res.status(409).json({
        success: false,
        message:
          "Rental invoice must be fully paid before refund preparation",
      });
    }

    // ==========================================
    // VALIDATE SECURITY DEPOSIT
    // ==========================================

    const deposit = await Deposit.findOne({
      invoice: invoice._id,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Security deposit record not found",
      });
    }

    if (deposit.status !== "HELD") {
      return res.status(409).json({
        success: false,
        message:
          "Only HELD security deposits can be prepared for refund",
      });
    }

    
    // ==========================================
    // PREVENT DUPLICATE REFUND REQUESTS
    // ==========================================

    const existingRefund = await Refund.findOne({
      deposit: deposit._id,
      status: {
        $in: ["PENDING", "COMPLETED"],
      },
    });

    if (existingRefund) {
      return res.status(409).json({
        success: false,
        message:
          "A pending or completed refund already exists for this deposit",
      });
    }

    // Verify deposit matches the invoice.
    if (
      !Number.isFinite(Number(deposit.amount)) ||
      Number(deposit.amount) <= 0 ||
      Number(deposit.amount) !== Number(invoice.securityDeposit)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Security deposit amount does not match the rental invoice",
      });
    }
        
    // ==========================================
    // VALIDATE DAMAGE ASSESSMENT
    // ==========================================

    const damageRecords = await DamageRecord.find({
      rental: rental._id,
    });

    if (
      returnRecord.condition === "DAMAGED" &&
      damageRecords.length === 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Damaged equipment requires a damage assessment",
      });
    }

    // All damage assessments must be finalized.
    const unfinishedDamage = damageRecords.find(
      (damage) => damage.status !== "RESOLVED"
    );

    if (unfinishedDamage) {
      return res.status(409).json({
        success: false,
        message:
          "All damage assessments must be resolved before refund preparation",
      });
    }

    // Validate recorded repair costs.
    const invalidRepairCost = damageRecords.some(
      (damage) =>
        !Number.isFinite(Number(damage.repairCost)) ||
        Number(damage.repairCost) < 0
    );

    if (invalidRepairCost) {
      return res.status(409).json({
        success: false,
        message: "Invalid repair cost in damage records",
      });
    }


 // ==========================================
 // VALIDATE DAMAGE DEDUCTION REVIEWS
 // ==========================================

const unreviewedDamage = damageRecords.find(
  (damage) =>
    !["APPROVED", "REJECTED"].includes(
      damage.deductionApprovalStatus
    )
);

if (unreviewedDamage) {
  return res.status(409).json({
    success: false,
    message:
      "All damage deductions must be reviewed before refund preparation",
  });
}

const invalidApproval = damageRecords.some((damage) => {
  const approved = Number(damage.approvedDeductionAmount);

  return (
    !Number.isFinite(approved) ||
    approved < 0 ||
    approved > Number(damage.repairCost) ||
    (damage.deductionApprovalStatus === "REJECTED" &&
      approved !== 0)
  );
});

if (invalidApproval) {
  return res.status(409).json({
    success: false,
    message: "Invalid approved damage deduction",
  });
}

// ==========================================
// CALCULATE APPROVED DEDUCTIONS
// ==========================================

const totalRepairCost = damageRecords.reduce(
  (total, damage) => total + Number(damage.repairCost),
  0
);

    // ==========================================
    // CALCULATE APPROVED DAMAGE DEDUCTIONS
    // ==========================================

    const totalApprovedDamageDeduction = damageRecords.reduce(
      (total, damage) =>
        total +
        (damage.deductionApprovalStatus === "APPROVED"
          ? Number(damage.approvedDeductionAmount)
          : 0),
      0
    );

    // ==========================================
    // INCLUDE APPROVED OVERDUE PENALTY
    // ==========================================

    const approvedOverduePenalty =
      getApprovedOverduePenalty(rental);

    const totalApprovedDeduction =
      Math.round(
        (
          totalApprovedDamageDeduction +
          approvedOverduePenalty +
          Number.EPSILON
        ) * 100
      ) / 100;

    const depositAmount = Number(deposit.amount);

    // ==========================================
    // ALLOCATE SECURITY DEPOSIT DEDUCTIONS
    // DAMAGE FIRST, THEN OVERDUE PENALTY
    // ==========================================

    const allocation = calculateDepositDeductionAllocation({
      depositAmount,
      approvedDamageDeduction: totalApprovedDamageDeduction,
      approvedOverduePenalty,
    });

    const proposedDeduction = allocation.totalDeduction;
    const proposedRefund = allocation.refundableAmount;

  return res.status(200).json({
    success: true,
    message: "Refund preparation validation successful",

      data: {
        rentalId: rental._id,
        invoiceId: invoice._id,
        depositId: deposit._id,
        refundMethod,

        depositAmount,
        totalRepairCost,

        totalApprovedDamageDeduction,
        approvedOverduePenalty,
        totalApprovedDeduction,

        proposedDeduction,
        proposedRefund,

        damageRecovered: allocation.damageRecovered,
        damageOutstanding: allocation.damageOutstanding,

        overduePenaltyRecovered:
          allocation.overduePenaltyRecovered,

        overduePenaltyOutstanding:
          allocation.overduePenaltyOutstanding,

        status: "VALIDATION_ONLY",
      },

  }); 

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }

};



const reviewDamageDeduction = async (req, res, next) => {
  let session;

  const reviewError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  };

  try {
    const { damageId } = req.params;
    const { decision, approvedDeductionAmount } = req.body;

    // ==========================================
    // VALIDATE REQUEST
    // ==========================================

    if (!mongoose.isValidObjectId(damageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid damage record ID",
      });
    }

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be APPROVED or REJECTED",
      });
    }

    session = await mongoose.startSession();

    // ==========================================
    // REVIEW INSIDE DATABASE TRANSACTION
    // ==========================================

    const updatedDamage = await session.withTransaction(
      async () => {
        const damage = await DamageRecord.findById(
          damageId
        ).session(session);

        if (!damage) {
          throw reviewError(404, "Damage record not found");
        }

        if (damage.status !== "RESOLVED") {
          throw reviewError(
            409,
            "Damage must be resolved before deduction review"
          );
        }

        if (
          (damage.deductionApprovalStatus || "PENDING") !==
          "PENDING"
        ) {
          throw reviewError(
            409,
            "Damage deduction has already been reviewed"
          );
        }

        const rental = await Rental.findById(
          damage.rental
        ).session(session);

        if (!rental || rental.status !== "RETURNED") {
          throw reviewError(
            409,
            "Rental must be returned before deduction review"
          );
        }

        const invoice = await Invoice.findOne({
          rental: rental._id,
        }).session(session);

        if (!invoice) {
          throw reviewError(404, "Rental invoice not found");
        }

        const deposit = await Deposit.findOne({
          invoice: invoice._id,
        }).session(session);

        if (!deposit || deposit.status !== "HELD") {
          throw reviewError(
            409,
            "A HELD security deposit is required"
          );
        }

        // ==========================================
        // VALIDATE DEDUCTION AMOUNT
        // ==========================================

        const repairCost = Number(damage.repairCost);

        const amount =
          decision === "REJECTED"
            ? 0
            : Number(approvedDeductionAmount);

        if (
          !Number.isFinite(repairCost) ||
          repairCost < 0 ||
          (decision === "APPROVED" &&
            (approvedDeductionAmount === undefined ||
              approvedDeductionAmount === null ||
              approvedDeductionAmount === ""))
        ) {
          throw reviewError(
            400,
            "A valid repair cost and approved deduction amount are required"
          );
        }

        if (
          !Number.isFinite(amount) ||
          amount < 0 ||
          amount > repairCost
        ) {
          throw reviewError(
            400,
            "Approved deduction must be between zero and the repair cost"
          );
        }

        // ==========================================
        // COORDINATE WITH REFUND TRANSACTION
        // ==========================================

        const depositClaim = await Deposit.findOneAndUpdate(
          {
            _id: deposit._id,
            status: "HELD",
          },
          {
            $inc: {
              settlementVersion: 1,
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          }
        );

        if (!depositClaim) {
          throw reviewError(
            409,
            "Deposit is no longer available for deduction review"
          );
        }

        // ==========================================
        // ATOMIC DAMAGE DEDUCTION APPROVAL
        // ==========================================

        const reviewedDamage =
          await DamageRecord.findOneAndUpdate(
            {
              _id: damage._id,
              status: "RESOLVED",
              deductionApprovalStatus: "PENDING",
              repairCost: damage.repairCost,
            },
            {
              $set: {
                deductionApprovalStatus: decision,
                approvedDeductionAmount: amount,
                deductionReviewedBy: req.user.userId,
                deductionReviewedAt: new Date(),
              },
            },
            {
              new: true,
              runValidators: true,
              session,
            }
          );

        if (!reviewedDamage) {
          throw reviewError(
            409,
            "Damage deduction was already reviewed or modified"
          );
        }

        return reviewedDamage;
      },
      {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      }
    );

    // ==========================================
    // SUCCESS RESPONSE AFTER COMMIT
    // ==========================================

    return res.status(200).json({
      success: true,
      message: `Damage deduction ${decision.toLowerCase()}`,
      data: {
        damageRecord: updatedDamage,
      },
    });
    

  } catch (error) {
    // ==========================================
    // HANDLE CONCURRENT TRANSACTION CONFLICTS
    // ==========================================

    if (
      error.code === 112 ||
      error.codeName === "WriteConflict" ||
      error.hasErrorLabel?.("TransientTransactionError")
    ) {
      return res.status(409).json({
        success: false,
        message:
          "The security deposit was modified by another operation. Please refresh and try again.",
      });
    }

    // Handle validation and business-rule errors.
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

 // ==========================================
 // CREATE PENDING RENTAL DEPOSIT REFUND
 // CLERK OR STAFF ADMIN
 // ==========================================

const createPendingRentalRefund = async (req, res, next) => {
  let session;

  try {
    const { id } = req.params;
    const { refundMethod } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID",
      });
    }

    if (!isValidRefundMethod(refundMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund method",
      });
    }

    // Start a database session only after input validation.
    session = await mongoose.startSession();

    // ==========================================
    // VALIDATE RENTAL, INVOICE AND DEPOSIT
    // INSIDE A TRANSACTION
    // ==========================================

    let validatedData = null;

    await session.withTransaction(async () => {
      const rental = await Rental.findById(id).session(session);

      if (!rental || rental.status !== "RETURNED") {
        const error = new Error(
          "Rental must exist and be RETURNED"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // PREVENT REFUND BEFORE OVERDUE REVIEW
      // ==========================================

      validateOverduePenaltyReview(rental);

      const returnRecord = await Return.findOne({
        rental: rental._id,
      }).session(session);

      if (!returnRecord) {
        const error = new Error("Return record not found");
        error.statusCode = 409;
        throw error;
      }

      const invoice = await Invoice.findOne({
        rental: rental._id,
      }).session(session);

      if (!invoice || invoice.paymentStatus !== "PAID") {
        const error = new Error(
          "Rental invoice must be fully paid"
        );
        error.statusCode = 409;
        throw error;
      }

      const deposit = await Deposit.findOne({
        invoice: invoice._id,
      }).session(session);

      if (
        !deposit ||
        deposit.status !== "HELD" ||
        !Number.isFinite(Number(deposit.amount)) ||
        Number(deposit.amount) <= 0 ||
        Number(deposit.amount) !==
          Number(invoice.securityDeposit)
      ) {
        const error = new Error(
          "A valid HELD security deposit is required"
        );
        error.statusCode = 409;
        throw error;
      }

      const existingRefund = await Refund.findOne({
        deposit: deposit._id,
        status: { $in: ["PENDING", "COMPLETED"] },
      }).session(session);

      if (existingRefund) {
        const error = new Error(
          "A refund already exists for this deposit"
        );
        error.statusCode = 409;
        throw error;
      }

      
        // ==========================================
        // COORDINATE REFUND WITH DEDUCTION REVIEWS
        // ==========================================

        const settlementLock = await Deposit.findOneAndUpdate(
          {
            _id: deposit._id,
            status: "HELD",
            amount: Number(deposit.amount),
          },
          {
            $inc: {
              settlementVersion: 1,
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          }
        );

        if (!settlementLock) {
          const error = new Error(
            "Security deposit is no longer available for settlement"
          );
          error.statusCode = 409;
          throw error;
        }

      // ==========================================
      // VALIDATE APPROVED DAMAGE DEDUCTIONS
      // ==========================================

      const damageRecords = await DamageRecord.find({
        rental: rental._id,
      }).session(session);

      if (
        returnRecord.condition === "DAMAGED" &&
        damageRecords.length === 0
      ) {
        const error = new Error(
          "Damaged return requires a damage assessment"
        );
        error.statusCode = 409;
        throw error;
      }

      const invalidDamage = damageRecords.some((damage) => {
        const repairCost = Number(damage.repairCost);
        const approved = Number(damage.approvedDeductionAmount);

        return (
          damage.status !== "RESOLVED" ||
          !["APPROVED", "REJECTED"].includes(
            damage.deductionApprovalStatus
          ) ||
          !Number.isFinite(repairCost) ||
          repairCost < 0 ||
          !Number.isFinite(approved) ||
          approved < 0 ||
          approved > repairCost ||
          (damage.deductionApprovalStatus === "REJECTED" &&
            approved !== 0)
        );
      });

      if (invalidDamage) {
        const error = new Error(
          "All damage assessments and deduction approvals must be valid and finalized"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // CALCULATE APPROVED DAMAGE DEDUCTIONS
      // ==========================================

      const totalApprovedDamageDeduction =
        damageRecords.reduce(
          (total, damage) =>
            total +
            (damage.deductionApprovalStatus === "APPROVED"
              ? Number(damage.approvedDeductionAmount)
              : 0),
          0
        );

      // ==========================================
      // INCLUDE APPROVED OVERDUE PENALTY
      // ==========================================

      const approvedOverduePenalty =
        getApprovedOverduePenalty(rental);

      const totalApprovedDeduction =
        Math.round(
          (
            totalApprovedDamageDeduction +
            approvedOverduePenalty +
            Number.EPSILON
          ) * 100
        ) / 100;

      const depositAmount = Number(deposit.amount);

      if (
        !Number.isFinite(totalApprovedDeduction) ||
        totalApprovedDeduction < 0
      ) {
        const error = new Error(
          "Invalid total approved deduction amount"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // ALLOCATE SECURITY DEPOSIT
      // DAMAGE FIRST, THEN OVERDUE PENALTY
      // ==========================================

      const allocation = calculateDepositDeductionAllocation({
        depositAmount,
        approvedDamageDeduction: totalApprovedDamageDeduction,
        approvedOverduePenalty,
      });

      // Verify that recovered + outstanding equals
      // the approved overdue penalty.
      validateOverduePenaltyAllocation({
        approvedOverduePenalty,
        overduePenaltyRecovered: allocation.overduePenaltyRecovered,
        overduePenaltyOutstanding: allocation.overduePenaltyOutstanding,
      });

      const deductionAmount = allocation.totalDeduction;
      const refundAmount = allocation.refundableAmount;

        // ==========================================
        // PREPARE ATOMIC DEPOSIT STATUS TRANSITION
        // ==========================================

        const claimDepositForRefund = async () => {
          return Deposit.findOneAndUpdate(
            {
              _id: deposit._id,
              status: "HELD",
              amount: depositAmount,
            },
            {
              $set: {
                status: "REFUND_PENDING",
                deductedAmount: deductionAmount,
              },
            },
            {
              new: true,
              runValidators: true,
              session,
            }
          );
        };

      // ==========================================
      // CREATE PENDING REFUND ATOMICALLY
      // ==========================================

      if (refundAmount <= 0) {
        const error = new Error(
          "No refundable balance. Full deduction requires a separate settlement."
        );
        error.statusCode = 409;
        throw error;
      }

      // Prevent a pending refund while another refund
      // already exists for the same deposit.
      const duplicateRefund = await Refund.findOne({
        deposit: deposit._id,
        status: { $in: ["PENDING", "COMPLETED"] },
      }).session(session);

      if (duplicateRefund) {
        const error = new Error(
          "A pending or completed refund already exists"
        );
        error.statusCode = 409;
        throw error;
      }

      const claimedDeposit = await claimDepositForRefund();

      if (!claimedDeposit) {
        const error = new Error(
          "Security deposit has already been claimed for settlement"
        );
        error.statusCode = 409;
        throw error;
      }

      const [pendingRefund] = await Refund.create(
        [
          {
            deposit: deposit._id,
            invoice: invoice._id,
            customer: deposit.customer,
            amount: refundAmount,
            refundMethod,
            status: "PENDING",
            notes: "Rental security deposit refund awaiting payout confirmation",
          },
        ],
        { session }
      );

      // ==========================================
      // RECORD OVERDUE PENALTY RECOVERY
      // DURING PENDING REFUND CREATION
      // ==========================================

      if (rental.overduePenaltyStatus === "APPROVED") {
        const penaltyFullyRecovered =
          allocation.overduePenaltyOutstanding === 0;

        const updatedRental = await Rental.findOneAndUpdate(
          {
            _id: rental._id,
            status: "RETURNED",
            overduePenaltyStatus: "APPROVED",
          },
          {
            $set: {
              overduePenaltyRecoveredAmount:
                allocation.overduePenaltyRecovered,

              overduePenaltyOutstandingAmount:
                allocation.overduePenaltyOutstanding,

              overduePenaltyStatus: penaltyFullyRecovered
                ? "SETTLED"
                : "APPROVED",
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          }
        );

        if (!updatedRental) {
          const error = new Error(
            "Overdue penalty recovery could not be recorded. Refresh and try again."
          );

          error.statusCode = 409;
          throw error;
        }
      }

      // ==========================================
      // CALCULATE OUTSTANDING BALANCE
      // ==========================================

      const outstandingBalance = Math.max(
        0,
        Math.round(
          (
            totalApprovedDeduction -
            deductionAmount +
            Number.EPSILON
          ) * 100
        ) / 100
      );

      validatedData = {
        rentalId: rental._id,
        invoiceId: invoice._id,
        depositId: deposit._id,
        refundId: pendingRefund._id,
        refundMethod,
        depositAmount,
        totalApprovedDamageDeduction,
        approvedOverduePenalty,
        totalApprovedDeduction,
        deductionAmount,
        refundAmount,
        outstandingBalance,
        damageRecovered: allocation.damageRecovered,
        damageOutstanding: allocation.damageOutstanding,

        overduePenaltyRecovered:
          allocation.overduePenaltyRecovered,

        overduePenaltyOutstanding:
          allocation.overduePenaltyOutstanding,
        refundStatus: pendingRefund.status,
        depositStatus: claimedDeposit.status,
      };

    });

    
    return res.status(201).json({
      success: true,
      message: "Pending rental deposit refund created successfully",
      data: validatedData,
    });

  
  } catch (error) {
    
    // ==========================================
    // HANDLE CONCURRENT TRANSACTION CONFLICTS
    // ==========================================

    if (
      error.code === 112 ||
      error.codeName === "WriteConflict" ||
      error.hasErrorLabel?.("TransientTransactionError")
    ) {
      return res.status(409).json({
        success: false,
        message:
          "The security deposit was modified by another operation. Please refresh and try again.",
      });
    }

    // Handle validation and business-rule conflicts.
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Handle duplicate refund index violations.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A refund request already exists for this deposit",
      });
    }

    // Other database or transaction errors.
    next(error);

  }finally {
    if (session) {
      await session.endSession();
    }
  }

};


const confirmRentalRefundPayout = async (req, res, next) => {
  let session;

  try {
    const { id, refundId } = req.params;

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(refundId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental or refund ID",
      });
    }

    const reference = req.body?.payoutReference;

    if (
      typeof reference !== "string" ||
      !reference.trim() ||
      reference.trim().length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid payout reference is required",
      });
    }

    session = await mongoose.startSession();

    let result;

    await session.withTransaction(async () => {
      const rental = await Rental.findById(id).session(session);

      if (!rental || rental.status !== "RETURNED") {
        const error = new Error("Rental must be RETURNED");
        error.statusCode = 409;
        throw error;
      }

      const invoice = await Invoice.findOne({
        rental: rental._id,
        customer: rental.customer,
      }).session(session);

      if (!invoice || invoice.paymentStatus !== "PAID") {
        const error = new Error("A fully paid invoice is required");
        error.statusCode = 409;
        throw error;
      }

      const deposit = await Deposit.findOne({
        invoice: invoice._id,
        customer: rental.customer,
      }).session(session);

      if (!deposit || deposit.status !== "REFUND_PENDING") {
        const error = new Error("Deposit must be REFUND_PENDING");
        error.statusCode = 409;
        throw error;
      }

      const refund = await Refund.findOne({
        _id: refundId,
        deposit: deposit._id,
        invoice: invoice._id,
        customer: rental.customer,
        status: "PENDING",
      }).session(session);

      if (!refund) {
        const error = new Error("Matching pending refund not found");
        error.statusCode = 409;
        throw error;
      }

      const depositAmount = Number(deposit.amount);
      const deductedAmount = Number(deposit.deductedAmount);
      const refundAmount = Number(refund.amount);

      // ==========================================
      // VERIFY OVERDUE PENALTY REVIEW AND SETTLEMENT
      // BEFORE REFUND PAYOUT CONFIRMATION
      // ==========================================

      validateOverduePenaltyReview(rental);

      validateOverduePenaltySettlementStatus(rental);

      if (
        ![depositAmount, deductedAmount, refundAmount].every(
          Number.isFinite
        ) ||
        depositAmount <= 0 ||
        deductedAmount < 0 ||
        refundAmount <= 0 ||
        Math.abs(
          depositAmount - deductedAmount - refundAmount
        ) > 0.001
      ) {
        const error = new Error(
          "Deposit deduction and refund totals do not reconcile"
        );
        error.statusCode = 409;
        throw error;
      }

      const now = new Date();

      const updatedDeposit = await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,
          status: "REFUND_PENDING",
          refundedAmount: 0,
        },
        {
          $set: {
            status:
              deductedAmount > 0
                ? "PARTIALLY_REFUNDED"
                : "REFUNDED",
            refundedAmount: refundAmount,
            settledAt: now,
            settledBy: req.user.userId,
            settlementNotes:
              `Refund payout confirmed. Reference: ${reference.trim()}`,
          },
          $inc: {
            settlementVersion: 1,
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!updatedDeposit) {
        const error = new Error(
          "Deposit settlement has already changed"
        );
        error.statusCode = 409;
        throw error;
      }

      const updatedRefund = await Refund.findOneAndUpdate(
        {
          _id: refund._id,
          deposit: deposit._id,
          invoice: invoice._id,
          customer: rental.customer,
          status: "PENDING",
        },
        {
          $set: {
            status: "COMPLETED",
            refundDate: now,

            // Payout audit information
            confirmedBy: req.user.userId,
            confirmedAt: now,
            payoutReference: reference.trim(),

            notes: `Payout confirmed. Reference: ${reference.trim()}`,
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!updatedRefund) {
        const error = new Error(
          "Refund has already been confirmed"
        );
        error.statusCode = 409;
        throw error;
      }

      result = {
        rentalId: rental._id,
        refund: updatedRefund,
        deposit: updatedDeposit,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Rental deposit refund payout confirmed",
      data: result,
    });
  } catch (error) {
    if (
      error.code === 112 ||
      error.code === 11000 ||
      error.codeName === "WriteConflict" ||
      error.hasErrorLabel?.("TransientTransactionError")
    ) {
      return res.status(409).json({
        success: false,
        message: "Refund settlement conflict. Refresh and try again.",
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};


 // ==========================================
 // SETTLE FULL SECURITY DEPOSIT DEDUCTION
 // CLERK OR STAFF ADMIN
 // ==========================================

const settleFullRentalDepositDeduction = async (req, res, next) => {
  let session;

  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID",
      });
    }

    session = await mongoose.startSession();

    let settlementResult = null;

    await session.withTransaction(async () => {
      // ==========================================
      // VALIDATE RENTAL AND RETURN
      // ==========================================

      const rental = await Rental.findById(id).session(session);

      if (!rental || rental.status !== "RETURNED") {
        const error = new Error(
          "Rental must exist and be RETURNED"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // VERIFY OVERDUE PENALTY REVIEW
      // BEFORE FULL DEPOSIT DEDUCTION
      // ==========================================

      validateOverduePenaltyReview(rental);

      const returnRecord = await Return.findOne({
        rental: rental._id,
      }).session(session);

      if (!returnRecord) {
        const error = new Error("Return record not found");
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // VALIDATE INVOICE AND DEPOSIT
      // ==========================================

      const invoice = await Invoice.findOne({
        rental: rental._id,
      }).session(session);

      if (!invoice || invoice.paymentStatus !== "PAID") {
        const error = new Error(
          "Rental invoice must be fully paid"
        );
        error.statusCode = 409;
        throw error;
      }

      const deposit = await Deposit.findOne({
        invoice: invoice._id,
      }).session(session);

      if (
        !deposit ||
        deposit.status !== "HELD" ||
        !Number.isFinite(Number(deposit.amount)) ||
        Number(deposit.amount) <= 0 ||
        Number(deposit.amount) !==
          Number(invoice.securityDeposit)
      ) {
        const error = new Error(
          "A valid HELD security deposit is required"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // PREVENT DUPLICATE SETTLEMENT
      // ==========================================

      const existingRefund = await Refund.findOne({
        deposit: deposit._id,
        status: { $in: ["PENDING", "COMPLETED"] },
      }).session(session);

      if (existingRefund) {
        const error = new Error(
          "A refund already exists for this deposit"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // LOCK DEPOSIT AGAINST CONCURRENT REVIEWS
      // ==========================================

      const lockedDeposit = await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,
          status: "HELD",
          amount: Number(deposit.amount),
        },
        {
          $inc: {
            settlementVersion: 1,
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!lockedDeposit) {
        const error = new Error(
          "Security deposit is no longer available for settlement"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // VALIDATE DAMAGE ASSESSMENTS
      // ==========================================

      const damageRecords = await DamageRecord.find({
        rental: rental._id,
      }).session(session);

      const invalidDamage = damageRecords.some((damage) => {
        const repairCost = Number(damage.repairCost);
        const approved = Number(
          damage.approvedDeductionAmount
        );

        return (
          damage.status !== "RESOLVED" ||
          !["APPROVED", "REJECTED"].includes(
            damage.deductionApprovalStatus
          ) ||
          !Number.isFinite(repairCost) ||
          repairCost < 0 ||
          !Number.isFinite(approved) ||
          approved < 0 ||
          approved > repairCost ||
          (damage.deductionApprovalStatus === "REJECTED" &&
            approved !== 0)
        );
      });

      if (invalidDamage) {
        const error = new Error(
          "All damage assessments and deduction approvals must be valid and finalized"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // CALCULATE APPROVED DEDUCTIONS
      // ==========================================

      // ==========================================
      // CALCULATE APPROVED DAMAGE DEDUCTIONS
      // ==========================================

      const totalApprovedDamageDeduction =
        damageRecords.reduce(
          (total, damage) =>
            total +
            (damage.deductionApprovalStatus === "APPROVED"
              ? Number(damage.approvedDeductionAmount)
              : 0),
          0
        );

      // ==========================================
      // INCLUDE APPROVED OVERDUE PENALTY
      // ==========================================

      const approvedOverduePenalty =
        getApprovedOverduePenalty(rental);

      const totalApprovedDeduction =
        Math.round(
          (
            totalApprovedDamageDeduction +
            approvedOverduePenalty +
            Number.EPSILON
          ) * 100
        ) / 100;

      const depositAmount = Number(deposit.amount);

      // ==========================================
      // ALLOCATE FULL SECURITY DEPOSIT
      // DAMAGE FIRST, THEN OVERDUE PENALTY
      // ==========================================

      const allocation = calculateDepositDeductionAllocation({
        depositAmount,
        approvedDamageDeduction: totalApprovedDamageDeduction,
        approvedOverduePenalty,
      });

      // ==========================================
      // VALIDATE OVERDUE PENALTY ALLOCATION
      // BEFORE FULL DEPOSIT SETTLEMENT
      // ==========================================

      validateOverduePenaltyAllocation({
        approvedOverduePenalty,
        overduePenaltyRecovered:
          allocation.overduePenaltyRecovered,
        overduePenaltyOutstanding:
          allocation.overduePenaltyOutstanding,
      });

      // ==========================================
      // VERIFY FULL DEPOSIT ALLOCATION
      // ==========================================

      if (
        Math.abs(allocation.totalDeduction - depositAmount) > 0.001 ||
        allocation.refundableAmount !== 0
      ) {
        const error = new Error(
          "Full deposit deduction allocation does not reconcile"
        );

        error.statusCode = 409;
        throw error;
      }

      if (
        !Number.isFinite(totalApprovedDeduction) ||
        totalApprovedDeduction < depositAmount
      ) {
        const error = new Error(
          "Full deduction requires approved deductions to cover the security deposit"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // FINAL DUPLICATE REFUND CHECK
      // ==========================================

      const duplicateRefund = await Refund.findOne({
        deposit: deposit._id,
        status: { $in: ["PENDING", "COMPLETED"] },
      }).session(session);

      if (duplicateRefund) {
        const error = new Error(
          "A pending or completed refund already exists"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // SETTLE DEPOSIT WITHOUT CREATING REFUND
      // ==========================================

      const now = new Date();

      const settledDeposit = await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,
          status: "HELD",
          amount: depositAmount,
        },
        {
          $set: {
            status: "DEDUCTED",
            deductedAmount: depositAmount,
            refundedAmount: 0,
            settledAt: now,
            settledBy: req.user.userId,
            settlementNotes:
              "Full security deposit deducted for approved damage and/or overdue penalties",
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!settledDeposit) {
        const error = new Error(
          "Security deposit has already been settled"
        );
        error.statusCode = 409;
        throw error;
      }

      // ==========================================
      // RECORD OVERDUE PENALTY RECOVERY
      // ==========================================

      if (rental.overduePenaltyStatus === "APPROVED") {
        const penaltyFullyRecovered =
          allocation.overduePenaltyOutstanding === 0;

        const updatedRental = await Rental.findOneAndUpdate(
          {
            _id: rental._id,
            status: "RETURNED",
            overduePenaltyStatus: "APPROVED",
          },
          {
            $set: {
              overduePenaltyRecoveredAmount:
                allocation.overduePenaltyRecovered,

              overduePenaltyOutstandingAmount:
                allocation.overduePenaltyOutstanding,

              overduePenaltyStatus: penaltyFullyRecovered
                ? "SETTLED"
                : "APPROVED",
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          }
        );

        if (!updatedRental) {
          const error = new Error(
            "Overdue penalty settlement changed. Refresh and try again."
          );

          error.statusCode = 409;
          throw error;
        }
      }

      // ==========================================
      // CALCULATE OUTSTANDING BALANCE
      // ==========================================

      const outstandingBalance =
        Math.max(
          0,
          Math.round(
            (
              totalApprovedDeduction -
              depositAmount +
              Number.EPSILON
            ) * 100
          ) / 100
        );

      // ==========================================
      // SETTLEMENT RESPONSE
      // ==========================================

      settlementResult = {
        rentalId: rental._id,
        invoiceId: invoice._id,
        depositId: settledDeposit._id,

        depositAmount,

        totalApprovedDamageDeduction,
        approvedOverduePenalty,
        totalApprovedDeduction,

        deductionAmount: depositAmount,
        refundAmount: 0,
        outstandingBalance,

        damageRecovered: allocation.damageRecovered,
        damageOutstanding: allocation.damageOutstanding,

        overduePenaltyRecovered:
          allocation.overduePenaltyRecovered,

        overduePenaltyOutstanding:
          allocation.overduePenaltyOutstanding,

        depositStatus: settledDeposit.status,
      };

    });

    return res.status(200).json({
      success: true,
      message:
        "Full security deposit deduction completed successfully",
      data: settlementResult,
    });
  } catch (error) {
    if (
      error.code === 112 ||
      error.codeName === "WriteConflict" ||
      error.hasErrorLabel?.("TransientTransactionError")
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Security deposit was modified by another operation. Refresh and try again.",
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A conflicting deposit settlement already exists",
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

module.exports = {
  settleRentalDeposit,
  prepareRentalDepositRefund,
  reviewDamageDeduction,
  createPendingRentalRefund,
  confirmRentalRefundPayout,
  settleFullRentalDepositDeduction,
};
