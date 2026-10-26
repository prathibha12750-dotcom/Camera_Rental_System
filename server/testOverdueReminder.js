
//added by abilash

require("dotenv").config();

const dns = require("node:dns");
const mongoose = require("mongoose");

const {
  sendRentalOverdueReminders,
} = require("./src/services/rentalReminderService");

const runTest = async () => {
  try {
    // Use the DNS configuration that worked in previous tests.
    dns.setServers(["192.248.48.1"]);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    // Simulate October 16, 2026.
    const simulatedDate = new Date("2026-10-16T12:00:00.000Z");

    const result = await sendRentalOverdueReminders(simulatedDate);

    console.log("Overdue reminder service result:", result);
  } catch (error) {
    console.error("Overdue reminder test failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runTest();

//ended by abilash
