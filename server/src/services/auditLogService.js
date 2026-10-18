
//added by abilash

const AuditLog = require("../models/AuditLog");

// ==========================================
// FR-085: RECORD SYSTEM ACTIVITY
// ==========================================

const logActivity = async ({
  actor = null,
  actorRole = "SYSTEM",
  action,
  entityType,
  entityId = null,
  outcome = "SUCCESS",
  message = "",
}) => {
  try {
    const auditLog = await AuditLog.create({
      actor,
      actorRole,
      action,
      entityType,
      entityId:
        entityId != null ? String(entityId) : null,
      outcome,
      message,
    });

    return auditLog;
  } catch (error) {
    // Do not expose sensitive request information.
   
    //added by abilash
    // FR-085: Identify failed audit writes without exposing sensitive data
    console.error("Audit logging failed:", {
      action,
      entityType,
      outcome,
      errorName: error.name,
    });
    //ended by abilash


    // Audit logging errors should not interrupt
    // existing application operations.
    return null;
  }
};

module.exports = {
  logActivity,
};

//ended by abilash
