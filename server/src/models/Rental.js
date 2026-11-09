
const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalPrice: {
      type: Number,
      min: 0,
    },

    
    //added by abilash

    // Security deposit required for this rental
    // Snapshot of the equipment deposit at booking time
    securityDeposit: {
      type: Number,
      min: [0, "Security deposit cannot be negative"],
      default: null,
    },

    //ended by abilash


    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "ACTIVE",
        "RETURNED",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    issuedAt: {
      type: Date,
      default: null,
    },

    returnedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // RENTAL REMINDER TRACKING
    // ==========================================

    returnDueReminderSentAt: {
      type: Date,
      default: null,
    },

    overdueReminderSentAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // OVERDUE PENALTY MANAGEMENT
    // ==========================================

    // Snapshot of the agreed overdue penalty rate.
    // Set when the rental request is created.
    overduePenaltyRate: {
      type: Number,
      default: null,
      min: [0, "Overdue penalty rate cannot be negative"],
      max: [100, "Overdue penalty rate cannot exceed 100%"],
    },

    // Fixed daily penalty amount for this rental.
    // Calculated using the equipment's daily rental
    // price at the time of the rental request.
    overduePenaltyPerDay: {
      type: Number,
      default: null,
      min: [0, "Daily overdue penalty cannot be negative"],
    },

    // Final number of overdue days.
    // Calculated when the equipment is returned.
    overdueDays: {
      type: Number,
      default: 0,
      min: [0, "Overdue days cannot be negative"],
    },

    // Final automatically calculated penalty amount.
    overduePenaltyAmount: {
      type: Number,
      default: 0,
      min: [0, "Overdue penalty cannot be negative"],
    },

    // Amount of overdue penalty actually recovered
    // through security deposit settlement.
    overduePenaltyRecoveredAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Approved overdue penalty still unpaid.
    overduePenaltyOutstandingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Penalty approval and settlement status.
    overduePenaltyStatus: {
      type: String,
      enum: [
        "NOT_APPLICABLE",
        "PENDING_REVIEW",
        "APPROVED",
        "REJECTED",
        "SETTLED",
      ],
      default: "NOT_APPLICABLE",
    },

    // Staff member who reviewed the penalty.
    overduePenaltyReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Date and time of the penalty review.
    overduePenaltyReviewedAt: {
      type: Date,
      default: null,
    },

    // Explanation for approval or rejection.
    overduePenaltyReviewNotes: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Overdue penalty review notes cannot exceed 1000 characters",
      ],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Rental", rentalSchema);
