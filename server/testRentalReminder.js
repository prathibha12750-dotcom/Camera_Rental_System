
 //added by abilash

require("dotenv").config();

const dns = require("node:dns");
const mongoose = require("mongoose");

const {
  sendRentalReturnDueReminders,
} = require("./src/services/rentalReminderService");

const runTest = async () => {
  try {
    // Use the DNS server that worked previously.
    dns.setServers(["192.248.48.1"]);

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    
    //added by abilash

    // Simulate October 16, 2026.
    // The service will find ACTIVE rentals due October 17.
    const simulatedDate = new Date("2026-10-16T12:00:00.000Z");

    const result = await sendRentalReturnDueReminders(
      simulatedDate
    );

    //ended by abilash


    console.log("Reminder service result:", result);
  } catch (error) {
    console.error("Reminder service test failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runTest();

//ended by abilash
