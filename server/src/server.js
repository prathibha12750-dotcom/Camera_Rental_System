const path = require("path");

// ==========================================
// FIX: RESOLVE MONGODB ATLAS DNS ISSUE
// ==========================================

const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);


// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================

require("dotenv").config({
  path: path.resolve(
    __dirname,
    "../.env"
  ),
});


// ==========================================
// APPLICATION / DATABASE
// ==========================================

const app = require("./app");
const connectDB = require("./config/db");

// Photographer subscription scheduler
const {
  startPhotographerSubscriptionScheduler,
} = require("./services/photographerSubscriptionScheduler");

// Rental reminder scheduler
const {
  startRentalReminderScheduler,
} = require("./services/rentalReminderScheduler");

const PORT =
  process.env.PORT || 5000;

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  try {

    // Connect to MongoDB before starting the server.
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );


      // Start background schedulers after
      // MongoDB connects successfully.

      startPhotographerSubscriptionScheduler();

      startRentalReminderScheduler();

    });

  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
};


startServer();