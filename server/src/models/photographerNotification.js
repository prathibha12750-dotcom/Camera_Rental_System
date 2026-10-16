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

          // Rental notification types
          "RENTAL_REQUEST_CONFIRMED",
          "RENTAL_EQUIPMENT_ISSUED",
          "RENTAL_RETURN_DUE",
          "RENTAL_OVERDUE",

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

      
      //added by abilash

      // Reference to the rental related to this notification
      rental: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rental",
        default: null,
      },

      //ended by abilash

    },
    {
      timestamps: true,
    }
  );

photographerNotificationSchema.index({
  user: 1,
  createdAt: -1,
});


//added by abilash

// FR-145 and FR-146:
// Prevent duplicate return-due and overdue
// notifications for the same rental and type.

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

//ended by abilash


module.exports =
  mongoose.model(
    "PhotographerNotification",
    photographerNotificationSchema
  );