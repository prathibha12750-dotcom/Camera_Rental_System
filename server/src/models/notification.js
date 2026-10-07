const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: [
                "RENTAL_REQUEST",
                "RENTAL_RETURN_DUE",
                "RENTAL_OVERDUE",
                "BOOKING_CONFIRMATION",
                "BOOKING_STATUS_CHANGE",
                "PAYMENT_RECORDED",
                "SUBSCRIPTION_PAYMENT_SUBMITTED",
                "SUBSCRIPTION_PAYMENT_APPROVED",
                "SUBSCRIPTION_PAYMENT_REJECTED",
            ],
            required: true,
        },

        relatedSubscriptionPayment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PhotographerSubscriptionPayment",
        default: null,
        },
        
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Notification", notificationSchema);