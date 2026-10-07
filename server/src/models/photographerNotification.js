const mongoose =
  require("mongoose");

const photographerNotificationSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
      },

      type: {
        type: String,
        enum: [
          "PHOTOGRAPHER_APPLICATION_APPROVED",
          "PHOTOGRAPHER_APPLICATION_REJECTED",

          "BOOKING_REQUESTED",
          "BOOKING_CONFIRMED",
          "BOOKING_REJECTED",
          "BOOKING_CANCELLED",
          "BOOKING_COMPLETED",

          "SUBSCRIPTION_PAYMENT_APPROVED",
          "SUBSCRIPTION_PAYMENT_REJECTED",

          // Subscription lifecycle notifications
          "SUBSCRIPTION_TRIAL_EXPIRED",
          "SUBSCRIPTION_GRACE_PERIOD_STARTED",
          "SUBSCRIPTION_EXPIRED",

          "GENERAL",
        ],
        default: "GENERAL",
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },

      read: {
        type: Boolean,
        default: false,
      },

      relatedApplication: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "PhotographerApplication",
        default: null,
      },

      relatedBooking: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        default: null,
      },

      relatedSubscriptionPayment: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "PhotographerSubscriptionPayment",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );


// ==========================================
// INDEXES
// ==========================================

photographerNotificationSchema.index({
  user: 1,
  createdAt: -1,
});


module.exports =
  mongoose.model(
    "PhotographerNotification",
    photographerNotificationSchema
  );