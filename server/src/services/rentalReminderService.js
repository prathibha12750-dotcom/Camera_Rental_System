
//added by abilash

const Rental = require("../models/Rental");
const PhotographerNotification = require(
  "../models/photographerNotification"
);

// ========================================
// FR-145: RENTAL RETURN DUE REMINDERS
// ========================================


  //added by abilash

  // Allow a custom reference date for testing.
  // Normal scheduled execution uses the current date.
  const sendRentalReturnDueReminders = async (
    referenceDate = new Date()
  ) => {
    const tomorrowStart = new Date(referenceDate);

    tomorrowStart.setUTCHours(0, 0, 0, 0);

    tomorrowStart.setUTCDate(
      tomorrowStart.getUTCDate() + 1
    );

  //ended by abilash


  const dayAfterTomorrow = new Date(tomorrowStart);
  dayAfterTomorrow.setUTCDate(
    dayAfterTomorrow.getUTCDate() + 1
  );

  // Find active rentals due tomorrow
  const rentals = await Rental.find({
    status: "ACTIVE",
    returnedAt: null,
    endDate: {
      $gte: tomorrowStart,
      $lt: dayAfterTomorrow,
    },
  });

  let createdCount = 0;

  for (const rental of rentals) {
    try {
      // Prevent duplicate reminders for the same rental
      const existingNotification =
        await PhotographerNotification.findOne({
          user: rental.customer,
          rental: rental._id,
          type: "RENTAL_RETURN_DUE",
        });

      if (existingNotification) {
        continue;
      }

      await PhotographerNotification.create({
        user: rental.customer,
        rental: rental._id,
        type: "RENTAL_RETURN_DUE",
        title: "Equipment Return Reminder",
        message:
          `Your rental equipment is due for return on ` +
          `${rental.endDate.toISOString().slice(0, 10)}. ` +
          `Please return it by the agreed deadline.`,
        read: false,
      });

      createdCount++;
    } catch (error) {
      console.error(
        `Failed to create return reminder for rental ${rental._id}:`,
        error
      );
    }
  }

  return {
    checkedRentals: rentals.length,
    createdNotifications: createdCount,
  };
};


//added by abilash

// ========================================
// FR-146: RENTAL OVERDUE REMINDERS
// ========================================

const sendRentalOverdueReminders = async (
  referenceDate = new Date()
) => {
  // Start of today in UTC.
  // Rentals ending before today are considered overdue.
  const todayStart = new Date(referenceDate);
  todayStart.setUTCHours(0, 0, 0, 0);

  // Find rentals that are active, unreturned, and overdue.
  const rentals = await Rental.find({
    status: "ACTIVE",
    returnedAt: null,
    endDate: {
      $lt: todayStart,
    },
  });

  let createdCount = 0;

  for (const rental of rentals) {
    try {
      // Avoid creating duplicate overdue notifications.
      const existingNotification =
        await PhotographerNotification.findOne({
          rental: rental._id,
          type: "RENTAL_OVERDUE",
        });

      if (existingNotification) {
        continue;
      }

      await PhotographerNotification.create({
        user: rental.customer,
        rental: rental._id,
        type: "RENTAL_OVERDUE",
        title: "Overdue Equipment Return",
        message:
          `Your rental equipment was due on ` +
          `${rental.endDate.toISOString().slice(0, 10)}. ` +
          `The return date has passed. Please return the equipment as soon as possible.`,
        read: false,
      });

      createdCount++;
    } catch (error) {
      console.error(
        `Failed to create overdue reminder for rental ${rental._id}:`,
        error
      );
    }
  }

  return {
    checkedRentals: rentals.length,
    createdNotifications: createdCount,
  };
};

//ended by abilash



module.exports = {
  sendRentalReturnDueReminders,

  //added by abilash
  sendRentalOverdueReminders,
  //ended by abilash
};


//ended by abilash
