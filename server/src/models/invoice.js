const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        rental: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Rental",
            default: null,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
        },
        serviceDetails: {
            type: String,
            required: true,
            trim: true,
        },
        serviceAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        securityDeposit: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING","PARTIALLY_PAID","PAID"],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Invoice", invoiceSchema);