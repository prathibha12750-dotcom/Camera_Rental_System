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

      //added by abilash
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


          // Photographer subscription notifications
          "SUBSCRIPTION_PAYMENT_APPROVED",
          "SUBSCRIPTION_PAYMENT_REJECTED",
          "SUBSCRIPTION_TRIAL_EXPIRED",
          "SUBSCRIPTION_GRACE_PERIOD_STARTED",
          "SUBSCRIPTION_EXPIRED",

          // Equipment rental notifications
          "RENTAL_REQUEST_CONFIRMED",
          "RENTAL_EQUIPMENT_ISSUED",
          "RENTAL_RETURN_DUE",
          "RENTAL_OVERDUE",

          // Financial notifications
          "DEPOSIT_RECORDED",
          "REFUND_RECORDED",
          "PAYMENT_RECORDED",
          "GENERAL",
        ],
        default: "GENERAL",
      },
      //ended by abilash

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

      // Photographer subscription payment reference
      relatedSubscriptionPayment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PhotographerSubscriptionPayment",
        default: null,
      },

      // Equipment rental reference
      rental: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rental",
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

// Prevent duplicate return-due and overdue
// notifications for the same rental.
photographerNotificationSchema.index(
  {
    rental: 1,
    type: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      rental: { $type: "objectId" },
      type: {
        $in: [
          "RENTAL_RETURN_DUE",
          "RENTAL_OVERDUE",
        ],
      },
    },
    name: "unique_rental_reminder_type",
  }
);

module.exports =
  mongoose.model(
    "PhotographerNotification",
    photographerNotificationSchema
  );