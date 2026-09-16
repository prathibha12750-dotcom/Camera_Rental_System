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

        refundDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Refund", refundSchema);