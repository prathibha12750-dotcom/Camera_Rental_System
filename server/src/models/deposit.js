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
            enum: ["PENDING", "HELD", "REFUNDED"],
            default: "PENDING",
        },
        //date when the deposit was recorded
        depositDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Deposit", depositSchema);