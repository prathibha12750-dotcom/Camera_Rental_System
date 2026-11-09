const mongoose = require("mongoose");


// ==========================================
// PHOTOGRAPHER SUBSCRIPTION PAYMENT SCHEMA
// ==========================================

const photographerSubscriptionPaymentSchema =
  new mongoose.Schema(
    {
      // ----------------------------------------
      // Photographer profile
      // ----------------------------------------

      photographer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photographer",
        required: [
          true,
          "Photographer reference is required",
        ],
        index: true,
      },


      // ----------------------------------------
      // Photographer User account
      // ----------------------------------------

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [
          true,
          "User reference is required",
        ],
        index: true,
      },


      // ----------------------------------------
      // Subscription amount
      // ----------------------------------------

      amount: {
        type: Number,
        required: [
          true,
          "Subscription amount is required",
        ],
        min: [
          0,
          "Subscription amount cannot be negative",
        ],
        default: 2500,
      },


      // ----------------------------------------
      // Currency
      // ----------------------------------------

      currency: {
        type: String,
        enum: ["LKR"],
        default: "LKR",
      },


      // ----------------------------------------
      // Payment status
      // ----------------------------------------

      paymentStatus: {
        type: String,
        enum: [
          "PENDING",
          "COMPLETED",
          "REJECTED",
          "FAILED",
        ],
        default: "PENDING",
        index: true,
      },


      // ----------------------------------------
      // Payment method
      // ----------------------------------------

      paymentMethod: {
        type: String,
        enum: [
          "CASH",
          "BANK_TRANSFER",
          "CARD",
        ],
        required: [
          true,
          "Payment method is required",
        ],
      },


      // ----------------------------------------
      // Optional payment reference
      // ----------------------------------------

      reference: {
        type: String,
        trim: true,
        maxlength: [
          150,
          "Payment reference cannot exceed 150 characters",
        ],
        default: "",
      },


      // ----------------------------------------
      // Payment completion date
      // ----------------------------------------

      paymentDate: {
        type: Date,
        default: null,
      },


      // ----------------------------------------
      // Subscription period covered
      // ----------------------------------------

      periodStart: {
        type: Date,
        default: null,
      },

      periodEnd: {
        type: Date,
        default: null,
      },

      // ==========================================
      // PAYMENT RECEIPT
      // ==========================================

      receiptUrl: {
        type: String,
        trim: true,
        default: "",
      },

      receiptOriginalName: {
        type: String,
        trim: true,
        maxlength: 255,
        default: "",
      },

      // ==========================================
      // VERIFICATION
      // ==========================================

      submittedAt: {
        type: Date,
        default: null,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },

      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

    },
    {
      timestamps: true,
    }
  );


// ==========================================
// INDEXES
// ==========================================

photographerSubscriptionPaymentSchema.index({
  photographer: 1,
  createdAt: -1,
});

photographerSubscriptionPaymentSchema.index({
  paymentStatus: 1,
  paymentDate: -1,
});


// ==========================================
// MODEL
// ==========================================

module.exports = mongoose.model(
  "PhotographerSubscriptionPayment",
  photographerSubscriptionPaymentSchema
);