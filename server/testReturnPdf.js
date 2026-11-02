
require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const mongoose = require("mongoose");

const RentalAgreement = require("./src/models/RentalAgreement");

const {
  generateRentalReturnPdf,
} = require("./src/services/rentalReturnPdfService");

const AGREEMENT_ID = "6ae444cdbe560fbd52e7dd92";

const runTest = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "MongoDB connection string is missing from .env"
      );
    }

    await mongoose.connect(mongoUri);

    const agreement =
      await RentalAgreement.findById(AGREEMENT_ID).lean();

    if (!agreement) {
      throw new Error("Test rental agreement not found.");
    }

    console.log("Agreement:", agreement.agreementNumber);

    const pdfBuffer = await generateRentalReturnPdf(agreement);

    const outputPath = path.join(
      __dirname,
      "return-acknowledgement-test.pdf"
    );

    await fs.writeFile(outputPath, pdfBuffer);

    console.log("PDF generated successfully.");
    console.log("Saved to:", outputPath);
    console.log("PDF size:", pdfBuffer.length, "bytes");
  } catch (error) {
    console.error("PDF test failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
