
const mongoose = require("mongoose");
const Rental = require("../models/Rental");
const Notification = require("../models/notification");

// ==========================================
// CONFIGURATION
// ==========================================

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let checkInProgress = false;
let intervalId = null;

// ==========================================
// CREATE REMINDER ATOMICALLY
// ==========================================

const createRentalReminder = async ({
  rentalId,
  reminderField,
  notificationType,
  title,
  message,
  dueSoon,
}) => {
  const session = await mongoose.startSession();

  try {
    let created = false;

    await session.withTransaction(async () => {
      const now = new Date();

      const dateCondition = dueSoon
        ? {
            $gt: now,
            $lte: new Date(
              now.getTime() + ONE_DAY_MS
            ),
          }
        : {
            $lt: now,
          };

      // Atomically claim this reminder.
      const rental = await Rental.findOneAndUpdate(
        {
          _id: rentalId,
          status: "ACTIVE",
          endDate: dateCondition,
          [reminderField]: null,
        },
        {
          $set: {
            [reminderField]: now,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!rental) {
        return;
      }

      // Save notification in the same transaction.
      await Notification.create(
        [
          {
            recipient: rental.customer,
            title,
            message,
            type: notificationType,
            isRead: false,
          },
        ],
        { session }
      );

      created = true;
    });

    return created;
  } finally {
    await session.endSession();
  }
};

// ==========================================
// CHECK UPCOMING RENTAL RETURNS
// ==========================================

const checkRentalReturnReminders = async () => {
  const now = new Date();

  const tomorrow = new Date(
    now.getTime() + ONE_DAY_MS
  );

  try {
    const rentals = await Rental.find({
      status: "ACTIVE",
      endDate: {
        $gt: now,
        $lte: tomorrow,
      },
      returnDueReminderSentAt: null,
    }).select("_id");

    let sentCount = 0;

    for (const rental of rentals) {
      try {
        const created = await createRentalReminder({
          rentalId: rental._id,
          reminderField:
            "returnDueReminderSentAt",
          notificationType:
            "RENTAL_RETURN_DUE",
          title: "Equipment Return Due Soon",
          message:
            "Your equipment rental is due for return " +
            "within the next 24 hours. " +
            "Please return the equipment on time.",
          dueSoon: true,
        });

        if (created) {
          sentCount += 1;
        }
      } catch (error) {
        console.error(
          `[Rental Reminder] Return-due failed for ${rental._id}:`,
          error.message
        );
      }
    }

    console.log(
      `[Rental Reminder] Return-due notifications created: ${sentCount}`
    );
  } catch (error) {
    console.error(
      "[Rental Reminder] Return-due check failed:",
      error.message
    );
  }
};

// ==========================================
// CHECK OVERDUE RENTALS
// ==========================================

const checkRentalOverdueReminders = async () => {
  try {
    const now = new Date();

    const rentals = await Rental.find({
      status: "ACTIVE",
      endDate: {
        $lt: now,
      },
      overdueReminderSentAt: null,
    }).select("_id");

    let sentCount = 0;

    for (const rental of rentals) {
      try {
        const created = await createRentalReminder({
          rentalId: rental._id,
          reminderField:
            "overdueReminderSentAt",
          notificationType:
            "RENTAL_OVERDUE",
          title: "Equipment Rental Overdue",
          message:
            "Your equipment rental is overdue. " +
            "Please return the equipment as soon as possible.",
          dueSoon: false,
        });

        if (created) {
          sentCount += 1;
        }
      } catch (error) {
        console.error(
          `[Rental Reminder] Overdue failed for ${rental._id}:`,
          error.message
        );
      }
    }

    console.log(
      `[Rental Reminder] Overdue notifications created: ${sentCount}`
    );
  } catch (error) {
    console.error(
      "[Rental Reminder] Overdue check failed:",
      error.message
    );
  }
};

// ==========================================
// RUN BOTH CHECKS
// ==========================================

const checkAllRentalReminders = async () => {
  if (checkInProgress) {
    return;
  }

  checkInProgress = true;

  try {
    await checkRentalReturnReminders();
    await checkRentalOverdueReminders();
  } finally {
    checkInProgress = false;
  }
};

// ==========================================
// START SCHEDULER
// ==========================================

const startRentalReminderScheduler = () => {
  if (intervalId) {
    return intervalId;
  }

  console.log(
    "[Rental Reminder] Scheduler started. Checking every 5 minutes."
  );

  // Run immediately after backend startup.
  checkAllRentalReminders();

  // Repeat every five minutes.
  intervalId = setInterval(
    checkAllRentalReminders,
    CHECK_INTERVAL_MS
  );

  return intervalId;
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  checkRentalReturnReminders,
  checkRentalOverdueReminders,
  checkAllRentalReminders,
  startRentalReminderScheduler,
};
