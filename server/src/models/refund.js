const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
    {
        deposit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Deposit",
            required: true,
        },

        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        refundMethod: {
            type: String,
            enum: ["CASH", "BANK_TRANSFER", "CARD"],
            required: true,
        },

        status: {
            type: String,
            enum: ["PENDING", "COMPLETED"],
            default: "COMPLETED",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        // Date associated with the refund record.
        refundDate: {
            type: Date,
            default: Date.now,
        },

        // ==========================================
        // REFUND PAYOUT AUDIT INFORMATION
        // ==========================================

        // Staff member who confirmed the actual payout.
        confirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Date and time payout was confirmed.
        confirmedAt: {
            type: Date,
            default: null,
        },

        // Bank transaction ID or other payout reference.
        payoutReference: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "",
        },

    },
    {
        timestamps: true,
    }
);


// Prevent duplicate pending or completed refunds
// for the same security deposit.
refundSchema.index(
  { deposit: 1 },
  {
    name: "unique_active_refund_per_deposit",
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ["PENDING", "COMPLETED"],
      },
    },
  }
);

module.exports =
  mongoose.models.Refund ||
  mongoose.model("Refund", refundSchema);