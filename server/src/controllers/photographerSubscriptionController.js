const User =
  require("../models/User");

const Photographer =
  require("../models/Photographer");

const PhotographerSubscriptionPayment =
  require(
    "../models/PhotographerSubscriptionPayment"
  );

const PHOTOGRAPHER_SUBSCRIPTION =
  require(
    "../config/photographerSubscription"
  );

const {
  calculateSubscriptionEnd,
  calculateGracePeriodEnd,
} = require(
  "../services/photographerSubscriptionService"
);

const fs = require("fs");
const path = require("path");
const Notification = require("../models/notification");
const PhotographerNotification = require("../models/photographerNotification");

// ==========================================
// REMOVE UPLOADED RECEIPT
// ==========================================

const removeUploadedReceipt = (file) => {
  if (!file?.path) {
    return;
  }

  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (error) {
    console.error(
      "Unable to remove uploaded subscription receipt:",
      error.message
    );
  }
};

// ==========================================
// GET MY SUBSCRIPTION
// GET /api/photographer/subscription
// ==========================================

const getMySubscription =
  async (req, res, next) => {
    try {
      const photographer =
        await Photographer.findOne({
          user: req.user.userId,
        });

      if (!photographer) {
        return res.status(404).json({
          success: false,
          message:
            "Photographer profile not found.",
        });
      }


      const latestPayment =
        await PhotographerSubscriptionPayment
          .findOne({
            photographer:
              photographer._id,

            paymentStatus:
              "COMPLETED",
          })
          .sort({
            paymentDate: -1,
          });


      return res.status(200).json({
        success: true,

        data: {
          plan: {
            amount:
              PHOTOGRAPHER_SUBSCRIPTION
                .MONTHLY_FEE,

            currency:
              PHOTOGRAPHER_SUBSCRIPTION
                .CURRENCY,

            durationDays:
              PHOTOGRAPHER_SUBSCRIPTION
                .SUBSCRIPTION_DURATION_DAYS,

            gracePeriodDays:
              PHOTOGRAPHER_SUBSCRIPTION
                .GRACE_PERIOD_DAYS,

            trialDurationHours:
              PHOTOGRAPHER_SUBSCRIPTION
                .TRIAL_DURATION_HOURS,
          },

          subscription: {
            status:
              photographer
                .subscriptionStatus,

            trialEndsAt:
              photographer
                .trialEndsAt,

            subscriptionStartDate:
              photographer
                .subscriptionStartDate,

            subscriptionEndDate:
              photographer
                .subscriptionEndDate,

            gracePeriodEndsAt:
              photographer
                .gracePeriodEndsAt,
          },

          latestPayment:
            latestPayment
              ? {
                  id:
                    latestPayment._id,

                  amount:
                    latestPayment.amount,

                  currency:
                    latestPayment.currency,

                  paymentMethod:
                    latestPayment
                      .paymentMethod,

                  paymentDate:
                    latestPayment
                      .paymentDate,

                  periodStart:
                    latestPayment
                      .periodStart,

                  periodEnd:
                    latestPayment
                      .periodEnd,
                }
              : null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ==========================================
// PAY PHOTOGRAPHER SUBSCRIPTION
// POST /api/photographer/subscription/payment
// ==========================================

const paySubscription =
  async (req, res, next) => {
    let paymentCreated = false;

    try {
      const {
        paymentMethod,
        reference,
      } = req.body;

      // ======================================
      // VALIDATE PAYMENT METHOD
      // ======================================

      const allowedPaymentMethods = [
        "BANK_TRANSFER",
        "CARD",
      ];

      if (
        !paymentMethod ||
        !allowedPaymentMethods.includes(
          paymentMethod
        )
      ) {
        removeUploadedReceipt(req.file);

        return res.status(400).json({
          success: false,
          message:
            "A valid payment method is required.",
        });
      }

      // ======================================
      // REQUIRE PAYMENT RECEIPT
      // ======================================

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Payment receipt is required.",
        });
      }

      // ======================================
      // FIND PHOTOGRAPHER
      // ======================================

      const photographer =
        await Photographer.findOne({
          user: req.user.userId,
        });

      if (!photographer) {
        removeUploadedReceipt(req.file);

        return res.status(404).json({
          success: false,
          message:
            "Photographer profile not found.",
        });
      }

      // ======================================
      // FIND USER
      // ======================================

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        removeUploadedReceipt(req.file);

        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      // ======================================
      // ADMIN DISABLE MUST NEVER BE OVERRIDDEN
      // ======================================

      if (
        user.disabledReason ===
        "ADMIN_DISABLED"
      ) {
        removeUploadedReceipt(req.file);

        return res.status(403).json({
          success: false,
          message:
            "Your account has been disabled by the administrator.",
        });
      }

      // ======================================
      // PREVENT DUPLICATE PENDING PAYMENTS
      // ======================================

      const existingPendingPayment =
        await PhotographerSubscriptionPayment
          .findOne({
            photographer:
              photographer._id,

            paymentStatus:
              "PENDING",
          });

      if (existingPendingPayment) {
        removeUploadedReceipt(req.file);

        return res.status(409).json({
          success: false,
          message:
            "You already have a subscription payment awaiting verification.",
        });
      }

      // ======================================
      // CREATE PENDING PAYMENT
      // ======================================

      const submittedAt =
        new Date();

      const payment =
        await PhotographerSubscriptionPayment
          .create({
            photographer:
              photographer._id,

            user:
              user._id,

            amount:
              PHOTOGRAPHER_SUBSCRIPTION
                .MONTHLY_FEE,

            currency:
              PHOTOGRAPHER_SUBSCRIPTION
                .CURRENCY,

            paymentStatus:
              "PENDING",

            paymentMethod,

            reference:
              reference?.trim() || "",

            receiptUrl:
              req.file.filename,

            receiptOriginalName:
              req.file.originalname,

            submittedAt,

            // These fields are intentionally
            // empty until Clerk approval.
            paymentDate:
              null,

            periodStart:
              null,

            periodEnd:
              null,

            verifiedAt:
              null,

            verifiedBy:
              null,

            rejectionReason:
              "",
          });

      paymentCreated = true;

      try {
        await notifyActiveClerksOfSubscriptionPayment({
          payment,
          photographerName:
            user?.name || "A photographer",
        });
      } catch (notificationError) {
        console.error(
          "Unable to create Clerk subscription payment notification:",
          notificationError.message
        );
      }

      // ======================================
      // IMPORTANT:
      //
      // Do NOT activate the subscription here.
      // Do NOT reactivate the User here.
      //
      // Clerk approval performs those actions.
      // ======================================

      return res.status(201).json({
        success: true,

        message:
          "Payment receipt submitted successfully. Your payment is awaiting Clerk verification.",

        data: {
          payment: {
            id:
              payment._id,

            amount:
              payment.amount,

            currency:
              payment.currency,

            paymentStatus:
              payment.paymentStatus,

            paymentMethod:
              payment.paymentMethod,

            reference:
              payment.reference,

            receiptOriginalName:
              payment.receiptOriginalName,

            submittedAt:
              payment.submittedAt,
          },

          subscription: {
            status:
              photographer
                .subscriptionStatus,

            subscriptionStartDate:
              photographer
                .subscriptionStartDate,

            subscriptionEndDate:
              photographer
                .subscriptionEndDate,

            gracePeriodEndsAt:
              photographer
                .gracePeriodEndsAt,
          },

          account: {
            status:
              user.status,

            disabledReason:
              user.disabledReason,
          },
        },
      });
    } catch (error) {
      // If Multer successfully stored a receipt
      // but the payment record could not be
      // created, remove the orphaned file.
      if (
        req.file &&
        !paymentCreated
      ) {
        removeUploadedReceipt(
          req.file
        );
      }

      next(error);
    }
  };

// ==========================================
// GET MY SUBSCRIPTION PAYMENT HISTORY
// ==========================================

const getMySubscriptionPayments =
  async (req, res, next) => {
    try {
      const photographer =
        await Photographer.findOne({
          user: req.user.userId,
        });

      if (!photographer) {
        return res.status(404).json({
          success: false,
          message:
            "Photographer profile not found",
        });
      }

      const payments =
        await PhotographerSubscriptionPayment
          .find({
            photographer: photographer._id,
          })
          .sort({
            submittedAt: -1,
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        message:
          "Subscription payment history retrieved successfully",
        data: {
          payments,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ==========================================
// ADMIN - GET ALL SUBSCRIPTION PAYMENTS
// ==========================================

const getAllSubscriptionPayments =
  async (req, res, next) => {
    try {
      const payments =
        await PhotographerSubscriptionPayment
          .find({})
          .populate({
            path: "user",
            select: "name email",
          })
          .populate({
            path: "photographer",
            select: "specialization location",
          })
          .sort({
            submittedAt: -1,
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        message:
          "Photographer subscription payments retrieved successfully",
        data: {
          payments,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ==========================================
// CLERK / ADMIN - GET SUBSCRIPTION PAYMENTS
// ==========================================

const getSubscriptionPaymentsForVerification =
  async (req, res, next) => {
    try {
      const payments =
        await PhotographerSubscriptionPayment
          .find({})
          .populate({
            path: "user",
            select:
              "name email status disabledReason",
          })
          .populate({
            path: "photographer",
            select:
              "specialization location subscriptionStatus trialEndsAt subscriptionStartDate subscriptionEndDate gracePeriodEndsAt",
          })
          .populate({
            path: "verifiedBy",
            select: "name email role",
          })
          .sort({
            submittedAt: -1,
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        message:
          "Subscription payments retrieved successfully.",
        data: {
          payments,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ==========================================
// CLERK / ADMIN - APPROVE SUBSCRIPTION PAYMENT
// ==========================================

const approveSubscriptionPayment =
  async (req, res, next) => {
    try {
      const { paymentId } = req.params;

      // --------------------------------------
      // Find payment
      // --------------------------------------

      const payment =
        await PhotographerSubscriptionPayment
          .findById(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message:
            "Subscription payment not found.",
        });
      }

      // --------------------------------------
      // Only pending payments can be approved
      // --------------------------------------

      if (
        payment.paymentStatus !==
        "PENDING"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only pending subscription payments can be approved.",
        });
      }

      // --------------------------------------
      // Find Photographer and User
      // --------------------------------------

      const photographer =
        await Photographer.findById(
          payment.photographer
        );

      if (!photographer) {
        return res.status(404).json({
          success: false,
          message:
            "Photographer profile not found.",
        });
      }

      const user =
        await User.findById(
          payment.user
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Photographer user account not found.",
        });
      }

      // --------------------------------------
      // Calculate subscription period
      // --------------------------------------

      const approvalDate = new Date();

      let periodStart =
        approvalDate;

      // Early renewal:
      // preserve remaining ACTIVE time.
      if (
        photographer.subscriptionStatus ===
          "ACTIVE" &&
        photographer.subscriptionEndDate &&
        photographer.subscriptionEndDate >
          approvalDate
      ) {
        periodStart =
          new Date(
            photographer
              .subscriptionEndDate
          );
      }

      // Renewal during grace:
      // continue from previous paid end date.
      else if (
        photographer.subscriptionStatus ===
          "GRACE_PERIOD" &&
        photographer.subscriptionEndDate
      ) {
        periodStart =
          new Date(
            photographer
              .subscriptionEndDate
          );
      }

      // TRIAL / EXPIRED:
      // start the paid period when approved.

      const periodEnd =
        calculateSubscriptionEnd(
          periodStart
        );

      const gracePeriodEndsAt =
        calculateGracePeriodEnd(
          periodEnd
        );

      // --------------------------------------
      // Complete payment verification
      // --------------------------------------

      payment.paymentStatus =
        "COMPLETED";

      payment.paymentDate =
        approvalDate;

      payment.periodStart =
        periodStart;

      payment.periodEnd =
        periodEnd;

      payment.verifiedAt =
        approvalDate;

      payment.verifiedBy =
        req.user.userId;

      payment.rejectionReason = "";

      await payment.save();

      // --------------------------------------
      // Activate paid subscription
      // --------------------------------------

      photographer.subscriptionStatus =
        "ACTIVE";

      photographer.subscriptionStartDate =
        periodStart;

      photographer.subscriptionEndDate =
        periodEnd;

      photographer.gracePeriodEndsAt =
        gracePeriodEndsAt;

      await photographer.save();

      // --------------------------------------
      // Reactivate only when subscription was
      // the reason for account inactivity.
      //
      // Never override an Admin suspension.
      // --------------------------------------

      if (
        user.disabledReason !==
        "ADMIN_DISABLED"
      ) {
        user.status =
          "ACTIVE";

        user.disabledReason =
          "NONE";

        await user.save();
      }

      try {
        await notifyPhotographerOfSubscriptionDecision({
          userId:
            payment.user?._id ||
            payment.user,
          payment,
          approved: true,
        });
      } catch (notificationError) {
        console.error(
          "Unable to create Photographer subscription approval notification:",
          notificationError.message
        );
      }

      return res.status(200).json({
        success: true,

        message:
          user.disabledReason ===
          "ADMIN_DISABLED"
            ? "Payment approved and subscription activated. The account remains administratively disabled."
            : "Payment approved and photographer subscription activated successfully.",

        data: {
          payment: {
            id:
              payment._id,

            paymentStatus:
              payment.paymentStatus,

            amount:
              payment.amount,

            currency:
              payment.currency,

            paymentMethod:
              payment.paymentMethod,

            paymentDate:
              payment.paymentDate,

            periodStart:
              payment.periodStart,

            periodEnd:
              payment.periodEnd,

            verifiedAt:
              payment.verifiedAt,

            verifiedBy:
              payment.verifiedBy,
          },

          subscription: {
            status:
              photographer
                .subscriptionStatus,

            subscriptionStartDate:
              photographer
                .subscriptionStartDate,

            subscriptionEndDate:
              photographer
                .subscriptionEndDate,

            gracePeriodEndsAt:
              photographer
                .gracePeriodEndsAt,
          },

          account: {
            status:
              user.status,

            disabledReason:
              user.disabledReason,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ==========================================
// CLERK / ADMIN - REJECT SUBSCRIPTION PAYMENT
// ==========================================

const rejectSubscriptionPayment =
  async (req, res, next) => {
    try {
      const { paymentId } = req.params;

      const {
        rejectionReason,
      } = req.body;

      // --------------------------------------
      // Validate rejection reason
      // --------------------------------------

      if (
        !rejectionReason ||
        !rejectionReason.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A rejection reason is required.",
        });
      }

      const cleanedReason =
        rejectionReason.trim();

      if (cleanedReason.length > 500) {
        return res.status(400).json({
          success: false,
          message:
            "Rejection reason cannot exceed 500 characters.",
        });
      }

      // --------------------------------------
      // Find payment
      // --------------------------------------

      const payment =
        await PhotographerSubscriptionPayment
          .findById(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message:
            "Subscription payment not found.",
        });
      }

      // --------------------------------------
      // Only pending payments can be rejected
      // --------------------------------------

      if (
        payment.paymentStatus !==
        "PENDING"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only pending subscription payments can be rejected.",
        });
      }

      const verificationDate =
        new Date();

      // --------------------------------------
      // Mark payment as rejected
      // --------------------------------------

      payment.paymentStatus =
        "REJECTED";

      payment.verifiedAt =
        verificationDate;

      payment.verifiedBy =
        req.user.userId;

      payment.rejectionReason =
        cleanedReason;

      // A rejected payment must never represent
      // a successful subscription period.
      payment.paymentDate = null;
      payment.periodStart = null;
      payment.periodEnd = null;

      await payment.save();

      try {
        await notifyPhotographerOfSubscriptionDecision({
          userId:
            payment.user?._id ||
            payment.user,
          payment,
          approved: false,
          rejectionReason:
            cleanedReason,
        });
      } catch (notificationError) {
        console.error(
          "Unable to create Photographer subscription rejection notification:",
          notificationError.message
        );
      }

      return res.status(200).json({
        success: true,

        message:
          "Subscription payment rejected successfully.",

        data: {
          payment: {
            id:
              payment._id,

            paymentStatus:
              payment.paymentStatus,

            amount:
              payment.amount,

            currency:
              payment.currency,

            paymentMethod:
              payment.paymentMethod,

            reference:
              payment.reference,

            submittedAt:
              payment.submittedAt,

            verifiedAt:
              payment.verifiedAt,

            verifiedBy:
              payment.verifiedBy,

            rejectionReason:
              payment.rejectionReason,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ==========================================
// CLERK / ADMIN - VIEW PAYMENT RECEIPT
// ==========================================

const viewSubscriptionPaymentReceipt =
  async (req, res, next) => {
    try {
      const { paymentId } = req.params;

      const payment =
        await PhotographerSubscriptionPayment
          .findById(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message:
            "Subscription payment not found.",
        });
      }

      if (!payment.receiptUrl) {
        return res.status(404).json({
          success: false,
          message:
            "No payment receipt is available.",
        });
      }

      // Never trust a database value as a path.
      // Only use the filename portion.
      const safeFilename =
        path.basename(
          payment.receiptUrl
        );

      const receiptPath =
        path.join(
          process.cwd(),
          "uploads",
          "subscription-receipts",
          safeFilename
        );

      if (
        !fs.existsSync(receiptPath)
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Payment receipt file not found.",
        });
      }

      return res.sendFile(
        receiptPath
      );
    } catch (error) {
      next(error);
    }
  };

const getPhotographersSubscriptionOverview =
  async (req, res, next) => {
    try {
      // ======================================
      // GET ALL PHOTOGRAPHERS
      // ======================================

      const photographers =
        await Photographer.find({})
          .populate({
            path: "user",
            select:
              "name email status disabledReason",
          })
          .sort({
            createdAt: -1,
          });


      // ======================================
      // GET LATEST PAYMENT FOR EACH
      // PHOTOGRAPHER
      // ======================================

      const data =
        await Promise.all(
          photographers.map(
            async (photographer) => {
              const latestPayment =
                await PhotographerSubscriptionPayment
                  .findOne({
                    photographer:
                      photographer._id,
                  })
                  .select(
                    "paymentStatus paymentMethod reference submittedAt paymentDate verifiedAt rejectionReason amount currency"
                  )
                  .sort({
                    submittedAt: -1,
                    createdAt: -1,
                  });


              // ==================================
              // RETURN OVERVIEW RECORD
              // ==================================

              return {
                photographerId:
                  photographer._id,

                userId:
                  photographer.user?._id,

                name:
                  photographer.user
                    ?.name ||
                  "Unknown Photographer",

                email:
                  photographer.user
                    ?.email || "",

                accountStatus:
                  photographer.user
                    ?.status ||
                  "UNKNOWN",

                disabledReason:
                  photographer.user
                    ?.disabledReason ||
                  "NONE",

                specialization:
                  photographer
                    .specialization ||
                  "",

                location:
                  photographer.location ||
                  "",

                subscriptionStatus:
                  photographer
                    .subscriptionStatus ||
                  "TRIAL",

                trialEndsAt:
                  photographer
                    .trialEndsAt ||
                  null,

                subscriptionStartDate:
                  photographer
                    .subscriptionStartDate ||
                  null,

                subscriptionEndDate:
                  photographer
                    .subscriptionEndDate ||
                  null,

                gracePeriodEndsAt:
                  photographer
                    .gracePeriodEndsAt ||
                  null,


                // ==============================
                // LATEST PAYMENT INFORMATION
                // ==============================

                latestPayment:
                  latestPayment
                    ? {
                        paymentId:
                          latestPayment._id,

                        paymentStatus:
                          latestPayment
                            .paymentStatus,

                        paymentMethod:
                          latestPayment
                            .paymentMethod,

                        reference:
                          latestPayment
                            .reference ||
                          "",

                        amount:
                          latestPayment
                            .amount,

                        currency:
                          latestPayment
                            .currency,

                        submittedAt:
                          latestPayment
                            .submittedAt ||
                          null,

                        paymentDate:
                          latestPayment
                            .paymentDate ||
                          null,

                        verifiedAt:
                          latestPayment
                            .verifiedAt ||
                          null,

                        rejectionReason:
                          latestPayment
                            .rejectionReason ||
                          "",
                      }
                    : null,
              };
            }
          )
        );


      // ======================================
      // RESPONSE
      // ======================================

      return res.status(200).json({
        success: true,

        data: {
          photographers:
            data,
        },
      });
    } catch (error) {
      next(error);
    }
  };

const notifyActiveClerksOfSubscriptionPayment =
  async ({
    payment,
    photographerName,
  }) => {
    const clerks = await User.find({
      role: "CLERK",
      status: "ACTIVE",
    }).select("_id");

    if (clerks.length === 0) {
      return;
    }

    const notifications = clerks.map(
      (clerk) => ({
        recipient: clerk._id,
        title:
          "New Subscription Payment",
        message: `${photographerName} submitted a subscription payment receipt for verification.`,
        type:
          "SUBSCRIPTION_PAYMENT_SUBMITTED",
        relatedSubscriptionPayment:
          payment._id,
        isRead: false,
      })
    );

    await Notification.insertMany(
      notifications
    );
  };

  const notifyPhotographerOfSubscriptionDecision =
  async ({
    userId,
    payment,
    approved,
    rejectionReason = "",
  }) => {
    const notificationData = approved
      ? {
          title: "Subscription Payment Approved",
          message:
            "Your subscription payment has been verified and approved. Your subscription is now active.",
          type: "SUBSCRIPTION_PAYMENT_APPROVED",
        }
      : {
          title: "Subscription Payment Rejected",
          message: rejectionReason
            ? `Your subscription payment was rejected. Reason: ${rejectionReason}`
            : "Your subscription payment was rejected. Please review your payment details and submit a new receipt.",
          type: "SUBSCRIPTION_PAYMENT_REJECTED",
        };

        await PhotographerNotification.create({
          user: userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          relatedSubscriptionPayment:
            payment._id,
          read: false,
        });
  };

module.exports = {
  getMySubscription,
  paySubscription,
  getMySubscriptionPayments,
  getAllSubscriptionPayments,
  getSubscriptionPaymentsForVerification,
  approveSubscriptionPayment,
  rejectSubscriptionPayment,
  viewSubscriptionPaymentReceipt,
  getPhotographersSubscriptionOverview,
};