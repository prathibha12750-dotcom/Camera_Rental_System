
const fs = require("fs");
const path = require("path");
const {
  RENTAL_AGREEMENT_TERMS,
} = require("./src/constants/rentalAgreementTerms");
const {
  generateRentalAgreementPdf,
} = require("./src/services/rentalAgreementPdfService");

const testAgreement = {
  agreementNumber: "SCR-AGR-TEST-001",
  rental: "TEST-RENTAL-001",

  rentalSnapshot: {
    customerName: "Test Customer",
    equipmentName: "Canon EOS R6",
    brand: "Canon",
    model: "EOS R6",
    serialNumber: "CANON-TEST-12345",
    startDate: new Date("2026-11-02T09:00:00+05:30"),
    endDate: new Date("2026-11-05T09:00:00+05:30"),
    rentalAmount: 15000,
    securityDeposit: 50000,
    overduePenaltyRate: 10,
    overduePenaltyPerDay: 1500,
  },

  handoverInspection: {
    condition: "EXCELLENT",
    inspectedAt: new Date("2026-11-02T08:45:00+05:30"),

    accessories: Array.from({ length: 8 }, (_, index) => ({
    name: `Test Accessory ${index + 1}`,
    quantity: 1,
    condition: "GOOD",
    notes: "",
    })),

    damageDescription: "",
    notes: "All equipment checked before handover.",
  },

termsSnapshot: [...RENTAL_AGREEMENT_TERMS],

  specialNotes: "Return all accessories with the camera.",
};

async function main() {
  try {
    const pdfBuffer = await generateRentalAgreementPdf(
      testAgreement
    );

    const outputPath = path.join(
      __dirname,
      "SCR_Test_Rental_Agreement.pdf"
    );

    fs.writeFileSync(outputPath, pdfBuffer);

    console.log("PDF generated successfully.");
    console.log("File:", outputPath);
    console.log("Size:", pdfBuffer.length, "bytes");
  } catch (error) {
    console.error("PDF generation failed:", error.message);
    process.exitCode = 1;
  }
}

main();
