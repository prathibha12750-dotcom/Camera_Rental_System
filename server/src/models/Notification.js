const mongoose =
  require("mongoose");

const notificationSchema =
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
          mongoose.Schema.Types
            .ObjectId,
        ref: "PhotographerApplication",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

notificationSchema.index({
  user: 1,
  createdAt: -1,
});

module.exports =
  mongoose.model(
    "Notification",
    notificationSchema
  );