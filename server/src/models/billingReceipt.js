
//added by abilash

const mongoose = require("mongoose");

// ==========================================
// FR-167: BILLING RECEIPT DATA MODEL
// ==========================================

const billingReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [0.01, "Receipt amount must be greater than zero"],
    },

    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "CARD"],
      required: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "BillingReceipt",
  billingReceiptSchema
);

//ended by abilash
