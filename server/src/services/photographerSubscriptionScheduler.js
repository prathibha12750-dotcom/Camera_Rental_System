const User =
  require("../models/User");

const Photographer =
  require("../models/Photographer");

const PhotographerNotification =
  require("../models/photographerNotification");

const {
  syncPhotographerSubscription,
} = require(
  "./photographerSubscriptionService"
);


// ==========================================
// SCHEDULER CONFIGURATION
// ==========================================

// Check every 5 minutes.
//
// This is frequent enough for the 6-hour trial
// and 1-day grace-period rules without placing
// unnecessary load on MongoDB.
const SUBSCRIPTION_CHECK_INTERVAL_MS =
  5 * 60 * 1000;


// Prevent overlapping scheduler executions.
let checkInProgress = false;


// ==========================================
// CREATE SUBSCRIPTION LIFECYCLE NOTIFICATION
// ==========================================

const createSubscriptionLifecycleNotification =
  async ({
    user,
    previousSubscriptionStatus,
    currentSubscriptionStatus,
  }) => {
    let notification = null;


    // ------------------------------------------
    // TRIAL -> EXPIRED
    // ------------------------------------------

    if (
      previousSubscriptionStatus ===
        "TRIAL" &&
      currentSubscriptionStatus ===
        "EXPIRED"
    ) {
      notification = {
        type:
          "SUBSCRIPTION_TRIAL_EXPIRED",

        title:
          "Free Trial Expired",

        message:
          "Your photographer free trial has expired. Submit your subscription payment receipt to continue using photographer features.",
      };
    }


    // ------------------------------------------
    // ACTIVE -> GRACE PERIOD
    // ------------------------------------------

    if (
      previousSubscriptionStatus ===
        "ACTIVE" &&
      currentSubscriptionStatus ===
        "GRACE_PERIOD"
    ) {
      notification = {
        type:
          "SUBSCRIPTION_GRACE_PERIOD_STARTED",

        title:
          "Subscription Grace Period Started",

        message:
          "Your photographer subscription has reached its renewal date. You are now in the 1-day grace period. Please submit your renewal payment receipt before the grace period ends.",
      };
    }


    // ------------------------------------------
    // GRACE PERIOD -> EXPIRED
    //
    // Also handle ACTIVE -> EXPIRED.
    // This can happen if the backend was offline
    // throughout the grace period.
    // ------------------------------------------

    if (
      (
        previousSubscriptionStatus ===
          "GRACE_PERIOD" ||
        previousSubscriptionStatus ===
          "ACTIVE"
      ) &&
      currentSubscriptionStatus ===
        "EXPIRED"
    ) {
      notification = {
        type:
          "SUBSCRIPTION_EXPIRED",

        title:
          "Subscription Expired",

        message:
          "Your photographer subscription grace period has ended. Your photographer access is temporarily disabled until a subscription payment is verified.",
      };
    }


    // No lifecycle transition requiring
    // a notification.
    if (!notification) {
      return;
    }


    await PhotographerNotification.create({
      user:
        user._id,

      type:
        notification.type,

      title:
        notification.title,

      message:
        notification.message,

      read:
        false,
    });
  };


// ==========================================
// CHECK ALL PHOTOGRAPHER SUBSCRIPTIONS
// ==========================================

const checkPhotographerSubscriptions =
  async () => {
    if (checkInProgress) {
      console.log(
        "[Subscription Scheduler] Previous check is still running. Skipping."
      );

      return;
    }

    checkInProgress = true;

    try {
      // Full User documents are required because
      // syncPhotographerSubscription() may update
      // status and disabledReason and call save().
      const users =
        await User.find({
          role:
            "PHOTOGRAPHER",
        });

      let checkedCount = 0;
      let expiredCount = 0;
      let gracePeriodCount = 0;
      let notificationCount = 0;


      for (const user of users) {
        try {
          // --------------------------------------
          // Capture state BEFORE synchronization
          // --------------------------------------

          const photographerBefore =
            await Photographer.findOne({
              user:
                user._id,
            }).select(
              "subscriptionStatus"
            );

          const previousSubscriptionStatus =
            photographerBefore
              ?.subscriptionStatus ||
            null;

          const previousUserStatus =
            user.status;


          // --------------------------------------
          // RUN EXISTING SUBSCRIPTION LOGIC
          // --------------------------------------

          const result =
            await syncPhotographerSubscription(
              user
            );

          checkedCount += 1;

          const currentSubscriptionStatus =
            result?.photographer
              ?.subscriptionStatus ||
            null;


          // --------------------------------------
          // COUNTERS
          // --------------------------------------

          if (
            currentSubscriptionStatus ===
            "EXPIRED"
          ) {
            expiredCount += 1;
          }

          if (
            currentSubscriptionStatus ===
            "GRACE_PERIOD"
          ) {
            gracePeriodCount += 1;
          }


          // --------------------------------------
          // CREATE NOTIFICATION ONLY ON TRANSITION
          // --------------------------------------

          if (
            previousSubscriptionStatus &&
            currentSubscriptionStatus &&
            previousSubscriptionStatus !==
              currentSubscriptionStatus
          ) {
            try {
              await createSubscriptionLifecycleNotification(
                {
                  user,

                  previousSubscriptionStatus,

                  currentSubscriptionStatus,
                }
              );


              // These transitions create
              // lifecycle notifications.
              //
              // ACTIVE -> EXPIRED is included for
              // the case where the backend was
              // offline throughout the grace period.
              const validTransition =
                (
                  previousSubscriptionStatus ===
                    "TRIAL" &&
                  currentSubscriptionStatus ===
                    "EXPIRED"
                ) ||
                (
                  previousSubscriptionStatus ===
                    "ACTIVE" &&
                  currentSubscriptionStatus ===
                    "GRACE_PERIOD"
                ) ||
                (
                  previousSubscriptionStatus ===
                    "GRACE_PERIOD" &&
                  currentSubscriptionStatus ===
                    "EXPIRED"
                ) ||
                (
                  previousSubscriptionStatus ===
                    "ACTIVE" &&
                  currentSubscriptionStatus ===
                    "EXPIRED"
                );


              if (validTransition) {
                notificationCount += 1;

                console.log(
                  `[Subscription Scheduler] Notification created for ${user.email}: ${previousSubscriptionStatus} -> ${currentSubscriptionStatus}.`
                );
              }
            } catch (notificationError) {
              // A notification failure must not
              // prevent subscription enforcement.
              console.error(
                `[Subscription Scheduler] Failed to create notification for ${user.email}:`,
                notificationError.message
              );
            }
          }


          // --------------------------------------
          // LOG ACCOUNT STATUS CHANGE
          // --------------------------------------

          if (
            previousUserStatus !==
            user.status
          ) {
            console.log(
              `[Subscription Scheduler] Photographer ${user.email} account changed from ${previousUserStatus} to ${user.status}.`
            );
          }
        } catch (error) {
          // One Photographer failing must not stop
          // checks for all other Photographers.
          console.error(
            `[Subscription Scheduler] Failed to check photographer ${user.email}:`,
            error.message
          );
        }
      }


      console.log(
        `[Subscription Scheduler] Checked ${checkedCount} photographer(s). Expired: ${expiredCount}. Grace period: ${gracePeriodCount}. Notifications created: ${notificationCount}.`
      );
    } catch (error) {
      console.error(
        "[Subscription Scheduler] Check failed:",
        error.message
      );
    } finally {
      checkInProgress = false;
    }
  };


// ==========================================
// START SCHEDULER
// ==========================================

const startPhotographerSubscriptionScheduler =
  () => {
    console.log(
      "[Subscription Scheduler] Started. Checking every 5 minutes."
    );

    // Run once immediately when the backend starts.
    checkPhotographerSubscriptions();

    // Continue checking periodically.
    const intervalId =
      setInterval(
        checkPhotographerSubscriptions,
        SUBSCRIPTION_CHECK_INTERVAL_MS
      );

    return intervalId;
  };


module.exports = {
  checkPhotographerSubscriptions,
  startPhotographerSubscriptionScheduler,
};