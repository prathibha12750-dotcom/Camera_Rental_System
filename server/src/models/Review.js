const mongoose = require("mongoose");


const reviewSchema =
  new mongoose.Schema(
    {
      booking: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Booking",

        required: true,

        unique: true,
      },


      customer: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },


      photographer: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Photographer",

        required: true,
      },


      rating: {
        type: Number,

        required: true,

        min: 1,

        max: 5,
      },


      comment: {
        type: String,

        trim: true,

        maxlength: 1000,

        default: "",
      },
    },
    {
      timestamps: true,
    }
  );


// ==========================================
// INDEXES
// ==========================================

reviewSchema.index({
  photographer: 1,
  createdAt: -1,
});


module.exports =
  mongoose.model(
    "Review",
    reviewSchema
  );