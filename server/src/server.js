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

const connectDB =
  require("./config/db");


// ==========================================
// PHOTOGRAPHER SUBSCRIPTION SCHEDULER
// ==========================================

const {
  startPhotographerSubscriptionScheduler,
} = require(
  "./services/photographerSubscriptionScheduler"
);


const PORT =
  process.env.PORT || 5000;


// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  try {
    // Connect to MongoDB first.
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );

      // Start subscription checks only after
      // the database connection succeeds.
      startPhotographerSubscriptionScheduler();
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