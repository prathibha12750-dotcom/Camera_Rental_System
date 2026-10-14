const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
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
            required: [true, "Payment amount is required"],
            min: [0, "Payment amonut cannot be negative"],
        },
        paymentMethod: {
            type: String,
            enum: ["CASH", "BANK_TRANSFER","CARD"],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: [
                "PENDING_VERIFICATION",
                "COMPLETED",
                "REJECTED",
                "REFUNDED",
            ],
            default: "COMPLETED",
        },
        paymentDate: {
            type: Date,
            default: Date.now,
        },
        note: {
            type: String,
            trim: true,
            maxlength: [500, "Notes cannot exceed 500 charcters"],
        },
        // ==========================================
        // CUSTOMER PAYMENT RECEIPT
        // ==========================================

        paymentReference: {
            type: String,
            trim: true,
            maxlength: 100,
            default: null,
        },

        receiptUrl: {
            type: String,
            trim: true,
            default: null,
        },

        submittedAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // CLERK PAYMENT VERIFICATION
        // ==========================================

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        verifiedAt: {
            type: Date,
            default: null,
        },

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },

    },
    {
        timestamps: true,
    }
);

// ==========================================
// PREVENT DUPLICATE PENDING RECEIPTS
// ==========================================

paymentSchema.index(
  { invoice: 1 },
  {
    unique: true,
    partialFilterExpression: {
      paymentStatus: "PENDING_VERIFICATION",
    },
    name: "unique_pending_payment_per_invoice",
  }
);

module.exports =
  mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);