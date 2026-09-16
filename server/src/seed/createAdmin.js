require("dotenv").config({ path: "./server/.env" });

const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../models/User");


const createAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = "admin@camera-system.com";

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      process.exit(0);
    }

    // Hash admin password
    const passwordHash = await bcrypt.hash(
      "Admin@12345",
      12
    );

    // Create admin
    const admin = await User.create({
      name: "System Administrator",
      email: adminEmail,
      passwordHash,
      role: "STAFF_ADMIN",
      status: "ACTIVE",
    });

    console.log("Admin account created successfully.");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);

    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  }
};


createAdmin();