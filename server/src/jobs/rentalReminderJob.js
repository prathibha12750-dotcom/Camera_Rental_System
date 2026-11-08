
//added by abilash

const cron = require("node-cron");


const {
  sendRentalReturnDueReminders,

  //added by abilash
  sendRentalOverdueReminders,
  //ended by abilash

} = require("../services/rentalReminderService");


let isRunning = false;

const startRentalReminderJob = () => {
  // Run every day at 8:00 AM Sri Lanka time.
  cron.schedule(
    "0 8 * * *",
    async () => {
      // Prevent overlapping executions in this process.
      if (isRunning) {
        console.log("Rental reminder job already running. Skipping.");
        return;
      }

      isRunning = true;

      try {
        console.log("Running rental return-due reminder job...");

        const result = await sendRentalReturnDueReminders();

        console.log("Rental reminder job completed:", result);

        
        //added by abilash

        // FR-146: Check overdue rentals and notify customers.
        const overdueResult = await sendRentalOverdueReminders();

        console.log(
        "Rental overdue reminder job completed:",
        overdueResult
        );

        //ended by abilash

      } catch (error) {
        console.error("Rental reminder job failed:", error);
      } finally {
        isRunning = false;
      }
    },
    {
      timezone: "Asia/Colombo",
      noOverlap: true,
    }
  );

  console.log("Rental return-due reminder scheduler initialized.");
};

module.exports = { startRentalReminderJob };

//ended by abilash
