const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
    {
        //invoice associated with this security deposit
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: [true, "Invoice is required"],
        },

        //customer who paid the security deposit
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true,"Customer is required"],
        },

        //secrity deposit amount
        amount: {
            type: Number,
            required: [true, "Deposit amount is required"],
            min: [0, "Deposit amount cannot be negative"],
        },

        //current deposit status
        status: {
        type: String,
        enum: [
            "PENDING",
            "HELD",
            "REFUND_PENDING",
            "REFUNDED",
            "PARTIALLY_REFUNDED",
            "DEDUCTED",
        ],
        default: "PENDING",
        },

        //date when the deposit was recorded
        depositDate: {
            type: Date,
            default: Date.now,
        },

        // ==========================================
        // SECURITY DEPOSIT SETTLEMENT
        // ==========================================

        // Amount deducted for approved damage or charges.
        deductedAmount: {
        type: Number,
        min: [0, "Deducted amount cannot be negative"],
        default: 0,
        },
    
        settlementVersion: {
        type: Number,
        default: 0,
        min: 0,
        },

        // Amount returned to the customer.
        refundedAmount: {
        type: Number,
        min: [0, "Refunded amount cannot be negative"],
        default: 0,
        },

        // Explanation of the deposit settlement.
        settlementNotes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
        },

        // Staff member who completed the settlement.
        settledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        },

        // Date the deposit was settled.
        settledAt: {
        type: Date,
        default: null,
        },

    },
    {
        timestamps: true,
    }
);


depositSchema.index(
  { invoice: 1 },
  { unique: true }
);


module.exports =
  mongoose.models.Deposit ||
  mongoose.model("Deposit", depositSchema);