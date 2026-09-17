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
            enum: ["COMPLETED", "REFUNDED"],
            default: "COMPLETED"
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
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Payment", paymentSchema);