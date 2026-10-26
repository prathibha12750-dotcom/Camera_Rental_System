
 //added by abilash

require("dotenv").config();

const mongoose = require("mongoose");

const Notification = require("./src/models/photographerNotification");

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    await Notification.createIndexes();

    console.log("Notification indexes created successfully");
  } catch (error) {
    console.error("Index creation failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createIndexes();

//ended by abilash
