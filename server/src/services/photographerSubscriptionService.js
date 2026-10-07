const Photographer =
  require("../models/Photographer");

const PHOTOGRAPHER_SUBSCRIPTION =
  require("../config/photographerSubscription");


// ==========================================
// ADD HOURS TO DATE
// ==========================================

const addHours = (date, hours) => {
  const result = new Date(date);

  result.setHours(
    result.getHours() + hours
  );

  return result;
};


// ==========================================
// ADD DAYS TO DATE
// ==========================================

const addDays = (date, days) => {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result;
};


// ==========================================
// CALCULATE TRIAL END
// ==========================================

const calculateTrialEnd = (
  startDate = new Date()
) => {
  return addHours(
    startDate,
    PHOTOGRAPHER_SUBSCRIPTION
      .TRIAL_DURATION_HOURS
  );
};


// ==========================================
// CALCULATE SUBSCRIPTION END
// ==========================================

const calculateSubscriptionEnd = (
  startDate
) => {
  return addDays(
    startDate,
    PHOTOGRAPHER_SUBSCRIPTION
      .SUBSCRIPTION_DURATION_DAYS
  );
};


// ==========================================
// CALCULATE GRACE PERIOD END
// ==========================================

const calculateGracePeriodEnd = (
  subscriptionEndDate
) => {
  return addDays(
    subscriptionEndDate,
    PHOTOGRAPHER_SUBSCRIPTION
      .GRACE_PERIOD_DAYS
  );
};


// ==========================================
// SYNCHRONIZE PHOTOGRAPHER SUBSCRIPTION
// ==========================================

const syncPhotographerSubscription =
  async (user) => {
    if (
      !user ||
      user.role !== "PHOTOGRAPHER"
    ) {
      return {
        photographer: null,
        accessAllowed: true,
      };
    }

    const photographer =
      await Photographer.findOne({
        user: user._id,
      });

    if (!photographer) {
      return {
        photographer: null,
        accessAllowed: true,
      };
    }

    const now = new Date();

    // ======================================
    // TRIAL
    // ======================================

    if (
      photographer.subscriptionStatus ===
        "TRIAL" &&
      photographer.trialEndsAt &&
      photographer.trialEndsAt <= now
    ) {
      photographer.subscriptionStatus =
        "EXPIRED";

      await photographer.save();

      if (
        user.disabledReason !==
        "ADMIN_DISABLED"
      ) {
        user.status = "INACTIVE";
        user.disabledReason =
          "SUBSCRIPTION_EXPIRED";

        await user.save();
      }

      return {
        photographer,
        accessAllowed: false,
        reason: "TRIAL_EXPIRED",
      };
    }


    // ======================================
    // ACTIVE SUBSCRIPTION
    // ======================================

    if (
      photographer.subscriptionStatus ===
        "ACTIVE" &&
      photographer.subscriptionEndDate &&
      photographer.subscriptionEndDate <= now
    ) {
      photographer.subscriptionStatus =
        "GRACE_PERIOD";

      photographer.gracePeriodEndsAt =
        calculateGracePeriodEnd(
          photographer.subscriptionEndDate
        );

      await photographer.save();
    }


    // ======================================
    // GRACE PERIOD
    // ======================================

    if (
      photographer.subscriptionStatus ===
        "GRACE_PERIOD" &&
      photographer.gracePeriodEndsAt &&
      photographer.gracePeriodEndsAt <= now
    ) {
      photographer.subscriptionStatus =
        "EXPIRED";

      await photographer.save();

      if (
        user.disabledReason !==
        "ADMIN_DISABLED"
      ) {
        user.status = "INACTIVE";
        user.disabledReason =
          "SUBSCRIPTION_EXPIRED";

        await user.save();
      }

      return {
        photographer,
        accessAllowed: false,
        reason: "SUBSCRIPTION_EXPIRED",
      };
    }


    // ======================================
    // ALREADY EXPIRED
    // ======================================

    if (
    photographer.subscriptionStatus ===
    "EXPIRED"
    ) {
    // Keep an expired subscription blocked.
    // Do not overwrite an administrator suspension.
    if (
        user.disabledReason !==
        "ADMIN_DISABLED"
    ) {
        if (
        user.status !== "INACTIVE" ||
        user.disabledReason !==
            "SUBSCRIPTION_EXPIRED"
        ) {
        user.status = "INACTIVE";
        user.disabledReason =
            "SUBSCRIPTION_EXPIRED";

        await user.save();
        }
    }

    return {
        accessAllowed: false,
        reason: "SUBSCRIPTION_EXPIRED",
        photographer,
    };
    }

    return {
      photographer,
      accessAllowed: true,
    };
  };


module.exports = {
  calculateTrialEnd,
  calculateSubscriptionEnd,
  calculateGracePeriodEnd,
  syncPhotographerSubscription,
};