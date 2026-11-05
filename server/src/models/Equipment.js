const mongoose = require("mongoose");



// ==========================================
// MODIFICATION: Equipment Special Offers Schema
// MODIFIED BY: Thasindu
// PURPOSE: Allow admins to configure discounts
// and free bonuses with optional validity dates.
// ==========================================

const offerSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["NONE", "DISCOUNT", "BONUS"],
      default: "NONE",
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    bonusDescription: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// MODIFIED BY: Thasindu
// PURPOSE: Reject invalid active promotions
// before they can be saved.
offerSchema.pre("validate", function () {
  if (!this.enabled) return;

  if (!this.title?.trim()) {
    throw new Error("An active offer must have a title");
  }

  if (
    this.type === "DISCOUNT" &&
    !(this.discountPercentage > 0 && this.discountPercentage <= 100)
  ) {
    throw new Error("Discount must be between 1 and 100 percent");
  }

  if (this.type === "BONUS" && !this.bonusDescription?.trim()) {
    throw new Error("A bonus offer must describe the free bonus");
  }

  if (this.type === "NONE") {
    throw new Error("An active offer must have a valid type");
  }

  if (
    this.startAt &&
    this.endAt &&
    this.endAt <= this.startAt
  ) {
    throw new Error("Offer end date must be after start date");
  }
});

// END MODIFICATION: Equipment Special Offers Schema by Thasindu



const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
      minlength: [2, "Equipment name must be at least 2 characters long"],
      maxlength: [150, "Equipment name cannot exceed 150 characters"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Equipment category is required"],
    },

    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },

    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },

    serialNumber: {
      type: String,
      required: [true, "Serial number is required"],
      unique: true,
      trim: true,
    },

    rentalPricePerDay: {
      type: Number,
      required: [true, "Rental price per day is required"],
      min: [0, "Rental price cannot be negative"],
    },

    securityDeposit: {
      type: Number,
      required: [true, "Security deposit is required"],
      min: [0, "Security deposit cannot be negative"],
    },

    

    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "RESERVED",
        "RENTED",
        "MAINTENANCE",
        "DAMAGED",
      ],
      default: "AVAILABLE",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    imageUrl: {
        type: String,
        trim: true,
        default: "",
      },

      images: [
        {
          type: String,
          trim: true,
        },
      ],


      // MODIFIED BY: Thasindu
      // PURPOSE: Store optional promotional information on equipment.
      offer: {
        type: offerSchema,
        default: () => ({}),
      },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Equipment", equipmentSchema);