const path = require("path");

//fix: resolve MongoDB Atlas DNS connection issue
const dns = require("dns");
dns.setServers(["8.8.8.8","1.1.1.1"]);
//end of fix

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;


const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};


startServer();