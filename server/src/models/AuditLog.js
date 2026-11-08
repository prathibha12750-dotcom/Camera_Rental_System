
//added by abilash

const mongoose = require("mongoose");

// ==========================================
// FR-085: SYSTEM ACTIVITY AUDIT LOG MODEL
// ==========================================

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actorRole: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    entityType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    entityId: {
      type: String,
      trim: true,
      default: null,
    },

    outcome: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      required: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

// Indexes for efficient Admin monitoring
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports =
  mongoose.models.AuditLog ||
  mongoose.model("AuditLog", auditLogSchema);

//ended by abilash
