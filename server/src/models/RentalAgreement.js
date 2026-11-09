
const mongoose = require("mongoose");

// ==========================================
// SHARED INSPECTION FIELDS
// ==========================================

const inspectionSchema = new mongoose.Schema(
  {
    condition: {
      type: String,
      enum: ["EXCELLENT", "GOOD", "FAIR", "DAMAGED"],
      required: true,
    },

    accessories: {
    type: [
        {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        quantity: {
            type: Number,
            required: true,
            min: 0,
            validate: {
            validator: Number.isInteger,
            message: "Accessory quantity must be a whole number.",
            },
            default: 1,
        },

        condition: {
            type: String,
            enum: ["EXCELLENT", "GOOD", "FAIR", "DAMAGED"],
            default: null,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        },
    ],
    default: [],
    },

    damageDescription: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    inspectedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// ==========================================
// SIGNED DOCUMENT EVIDENCE
// ==========================================

const signedDocumentSchema = new mongoose.Schema(
  {
    storageKey: {
      type: String,
      trim: true,
      required: true,
    },

    originalName: {
      type: String,
      trim: true,
      maxlength: 255,
      required: true,
    },

    mimeType: {
      type: String,
      enum: ["application/pdf", "image/jpeg", "image/png"],
      required: true,
    },

    sha256: {
      type: String,
      match: /^[a-f0-9]{64}$/,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ==========================================
// RENTAL AGREEMENT
// ==========================================

const rentalAgreementSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true,
      unique: true,
      immutable: true,
    },

    agreementNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "GENERATED",
        "HANDOVER_SIGNED",
        "RETURN_SIGNED",
      ],
      default: "DRAFT",
      required: true,
    },

    // ==========================================
    // FIXED STANDARD TERMS
    // ==========================================

    termsVersion: {
      type: String,
      required: true,
      default: "1.0",
      immutable: true,
    },

    termsSnapshot: {
      type: [String],
      default: [],
    },

    // ==========================================
    // AGREED RENTAL SNAPSHOT
    // ==========================================

    rentalSnapshot: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      customerName: {
        type: String,
        required: true,
        trim: true,
      },

      equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Equipment",
        required: true,
      },

      equipmentName: {
        type: String,
        required: true,
        trim: true,
      },

      brand: {
        type: String,
        trim: true,
        default: "",
      },

      model: {
        type: String,
        trim: true,
        default: "",
      },

      serialNumber: {
        type: String,
        required: true,
        trim: true,
      },

      startDate: {
        type: Date,
        required: true,
      },

      endDate: {
        type: Date,
        required: true,
      },

      rentalAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      securityDeposit: {
        type: Number,
        required: true,
        min: 0,
      },

      overduePenaltyRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },

      overduePenaltyPerDay: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    // ==========================================
    // HANDOVER INSPECTION
    // ==========================================

    handoverInspection: {
      type: inspectionSchema,
      default: null,
    },

    specialNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    generatedAt: {
      type: Date,
      default: null,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Store an immutable copy of the generated PDF.
    generatedPdf: {
      type: signedDocumentSchema,
      default: null,
    },

    // Signed page 1, uploaded after handover.
    signedHandoverDocument: {
      type: signedDocumentSchema,
      default: null,
    },

    handoverVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    handoverVerifiedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // RETURN INSPECTION
    // ==========================================

    returnRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return",
      default: null,
    },

    returnInspection: {
      type: inspectionSchema,
      default: null,
    },

    // ==========================================
    // GENERATED RETURN ACKNOWLEDGEMENT
    // ==========================================

    generatedReturnPdf: {
    type: signedDocumentSchema,
    default: null,
    },

    generatedReturnAt: {
    type: Date,
    default: null,
    },

    generatedReturnBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    },

    // Signed complete two-page document.
    signedReturnDocument: {
      type: signedDocumentSchema,
      default: null,
    },

    returnVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    returnVerifiedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // AUDIT INFORMATION
    // ==========================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// INDEXES
// ==========================================

// The unique constraints on rental and agreementNumber
// create their own indexes. No duplicate index needed.

module.exports = mongoose.model(
  "RentalAgreement",
  rentalAgreementSchema
);
