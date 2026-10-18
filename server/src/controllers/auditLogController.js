
//added by abilash

const AuditLog = require("../models/AuditLog");

// ==========================================
// FR-085: GET SYSTEM ACTIVITY LOGS
// ==========================================

const getActivityLogs = async (req, res, next) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (typeof req.query.action === "string" &&
        req.query.action.trim()) {
      filter.action = req.query.action.trim();
    }

    if (
      ["SUCCESS", "FAILURE"].includes(req.query.outcome)
    ) {
      filter.outcome = req.query.outcome;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", "name email role")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "System activity logs retrieved successfully",
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
};

//ended by abilash
