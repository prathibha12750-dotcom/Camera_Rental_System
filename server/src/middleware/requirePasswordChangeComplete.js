const requirePasswordChangeComplete = (
  req,
  res,
  next
) => {
  if (req.user?.mustChangePassword) {
    return res.status(403).json({
      success: false,
      code: "PASSWORD_CHANGE_REQUIRED",
      message:
        "You must change your temporary password before accessing this feature.",
    });
  }

  next();
};

module.exports =
  requirePasswordChangeComplete;