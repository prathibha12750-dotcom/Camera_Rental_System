
const PDFDocument = require("pdfkit");

// ============================================================
// CONFIGURATION
// ============================================================

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  primary: "#172B4D",
  secondary: "#526477",
  border: "#D8E0E8",
  text: "#1F2937",
  light: "#F3F6FA",
};

const clean = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const sectionTitle = (doc, title, y) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.primary)
    .text(title, MARGIN, y);

  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .moveTo(MARGIN, y + 17)
    .lineTo(PAGE_WIDTH - MARGIN, y + 17)
    .stroke();

  return y + 27;
};

const drawText = (doc, text, x, y, width, fontSize = 8) => {
  const value = clean(text);

  doc
    .font("Helvetica")
    .fontSize(fontSize)
    .fillColor(COLORS.text);

  const height = doc.heightOfString(value, {
    width,
    lineGap: 2,
  });

  doc.text(value, x, y, {
    width,
    lineGap: 2,
  });

  return height;
};

const drawField = (doc, label, value, x, y, width) => {
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.secondary)
    .text(label, x, y, { width });

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(clean(value), x, y + 12, {
      width,
      height: 28,
      ellipsis: true,
    });
};

const drawTwoFields = (
  doc,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  y
) => {
  const gap = 16;
  const width = (CONTENT_WIDTH - gap) / 2;

  drawField(doc, leftLabel, leftValue, MARGIN, y, width);

  drawField(
    doc,
    rightLabel,
    rightValue,
    MARGIN + width + gap,
    y,
    width
  );

  return y + 38;
};


const ensureSpace = (doc, y, requiredHeight) => {
  const bottomLimit = PAGE_HEIGHT - 100;

  if (y + requiredHeight <= bottomLimit) {
    return y;
  }

  // Continue on a new page instead of losing content.
  doc.addPage();

  // Add a simple continuation heading.
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.primary)
    .text(
      "EQUIPMENT RETURN ACKNOWLEDGEMENT",
      MARGIN,
      MARGIN
    );

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.secondary)
    .text("Continued from previous page", MARGIN, MARGIN + 22);

  doc
    .strokeColor(COLORS.border)
    .moveTo(MARGIN, MARGIN + 42)
    .lineTo(PAGE_WIDTH - MARGIN, MARGIN + 42)
    .stroke();

  return MARGIN + 58;
};

// ============================================================
// ACCESSORY COMPARISON
// ============================================================

const buildAccessoryRows = (agreement) => {
  const issued =
    agreement.handoverInspection?.accessories || [];

  const returned =
    agreement.returnInspection?.accessories || [];

  const returnedMap = new Map();

  for (const item of returned) {
    const key = String(item.name || "")
      .trim()
      .toLowerCase();

    if (returnedMap.has(key)) {
      throw new Error(
        "Duplicate returned accessory names are not allowed."
      );
    }

    returnedMap.set(key, item);
  }

  const issuedNames = new Set();
  const rows = [];

  for (const item of issued) {
    const key = String(item.name || "")
      .trim()
      .toLowerCase();

    if (issuedNames.has(key)) {
      throw new Error(
        "Duplicate issued accessory names are not allowed."
      );
    }

    issuedNames.add(key);

    const returnedItem = returnedMap.get(key);

    if (!returnedItem) {
      throw new Error(
        `Returned quantity is missing for ${item.name}.`
      );
    }

    const issuedQuantity = Number(item.quantity);
    const returnedQuantity = Number(returnedItem.quantity);

    if (
      !Number.isSafeInteger(issuedQuantity) ||
      issuedQuantity < 1 ||
      !Number.isSafeInteger(returnedQuantity) ||
      returnedQuantity < 0 ||
      returnedQuantity > issuedQuantity
    ) {
      throw new Error(
        `Invalid accessory quantities for ${item.name}.`
      );
    }

    rows.push({
    name: item.name,

    issued: issuedQuantity,
    returned: returnedQuantity,
    missing: issuedQuantity - returnedQuantity,

    // Original accessory condition recorded at handover.
    handoverCondition: item.condition || "NOT RECORDED",

    // Actual condition recorded during equipment return.
    returnCondition:
        returnedQuantity === 0
        ? "NOT RETURNED"
        : returnedItem.condition || "NOT RECORDED",

    notes: returnedItem.notes || "",
    });
  }

  if (returnedMap.size !== issuedNames.size) {
    throw new Error(
      "Returned accessories do not match the handover inspection."
    );
  }

  return rows;
};

// ============================================================
// PDF GENERATION
// ============================================================

const generateRentalReturnPdf = (agreement) => {
  return new Promise((resolve, reject) => {
    try {
      if (
        !agreement?.returnRecord ||
        !agreement?.returnInspection?.condition ||
        !agreement?.returnInspection?.inspectedAt
      ) {
        throw new Error(
          "Complete the equipment return inspection first."
        );
      }

      const accessories = buildAccessoryRows(agreement);
      const snapshot = agreement.rentalSnapshot || {};
      const inspection = agreement.returnInspection;

      const doc = new PDFDocument({
        size: "A4",
        margin: MARGIN,
        autoFirstPage: false,
        bufferPages: true,
        info: {
          Title: `Return Acknowledgement ${agreement.agreementNumber}`,
          Author: "Southern Camera Rent",
          Subject: "Equipment Return Inspection and Acknowledgement",
        },
      });

      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("error", reject);
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.addPage();

      // ========================================================
      // HEADER
      // ========================================================

      doc
        .rect(0, 0, PAGE_WIDTH, 80)
        .fill(COLORS.primary);

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#FFFFFF")
        .text("SOUTHERN CAMERA RENT", MARGIN, 20);

      doc
        .font("Helvetica")
        .fontSize(9)
        .text("EQUIPMENT RETURN & ACKNOWLEDGEMENT", MARGIN, 46);

      let y = 96;

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text(
          `Agreement: ${clean(agreement.agreementNumber)}`,
          MARGIN,
          y
        );

      y += 16;

      // ========================================================
      // RENTAL DETAILS
      // ========================================================

      y = sectionTitle(doc, "1. RENTAL DETAILS", y + 8);

      y = drawTwoFields(
        doc,
        "Customer",
        snapshot.customerName,
        "Equipment",
        snapshot.equipmentName,
        y
      );

      y = drawTwoFields(
        doc,
        "Brand / Model",
        `${clean(snapshot.brand)} / ${clean(snapshot.model)}`,
        "Serial Number",
        snapshot.serialNumber,
        y
      );

      y = drawTwoFields(
        doc,
        "Rental End Date",
        formatDateTime(snapshot.endDate),
        "Return Inspection Date",
        formatDateTime(inspection.inspectedAt),
        y
      );

      // ========================================================
      // RETURN CONDITION
      // ========================================================

      y = sectionTitle(doc, "2. RETURN CONDITION", y + 6);

      y = drawTwoFields(
        doc,
        "Handover Condition",
        agreement.handoverInspection?.condition,
        "Returned Condition",
        inspection.condition,
        y
      );

      // ========================================================
      // ACCESSORIES
      // ========================================================

      y = sectionTitle(
        doc,
        "3. ACCESSORY COMPARISON",
        y + 6
      );

      const colX = [
        MARGIN,
        MARGIN + 230,
        MARGIN + 300,
        MARGIN + 380,
      ];

      doc
        .rect(MARGIN, y, CONTENT_WIDTH, 24)
        .fill(COLORS.light);

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.primary);

      doc.text("Accessory", colX[0] + 6, y + 8);
      doc.text("Issued", colX[1], y + 8);
      doc.text("Returned", colX[2], y + 8);
      doc.text("Missing", colX[3], y + 8);

      y += 29;

      for (const item of accessories) {
        const notes = item.notes.trim();

        doc.font("Helvetica").fontSize(8);

        const nameHeight = doc.heightOfString(item.name, {
          width: 220,
        });

        const notesHeight = notes
          ? doc.heightOfString(notes, {
              width: CONTENT_WIDTH - 12,
            })
          : 0;

        const rowHeight =
          Math.max(18, nameHeight + 6) +
          (notes ? notesHeight + 7 : 0);

        y = ensureSpace(doc, y, rowHeight + 10);

        doc
          .fillColor(COLORS.text)
          .text(item.name, colX[0] + 6, y, {
            width: 215,
          });

        doc.text(String(item.issued), colX[1], y);
        doc.text(String(item.returned), colX[2], y);
        doc.text(String(item.missing), colX[3], y);

        if (notes) {
          doc
            .fontSize(7)
            .fillColor(COLORS.secondary)
            .text(`Notes: ${notes}`, MARGIN + 6, y + 19, {
              width: CONTENT_WIDTH - 12,
            });
        }

        y += rowHeight + 7;

        doc
          .strokeColor(COLORS.border)
          .moveTo(MARGIN, y)
          .lineTo(PAGE_WIDTH - MARGIN, y)
          .stroke();

        y += 7;
      }

      // ========================================================
      // INSPECTION NOTES
      // ========================================================

      const damage =
        inspection.damageDescription?.trim() ||
        "No damage reported.";

      const notes =
        inspection.notes?.trim() ||
        "No additional observations.";

      // Keep the section heading and first content block together.
      doc.font("Helvetica").fontSize(8);

      const damageHeight = doc.heightOfString(damage, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });

      y = ensureSpace(doc, y + 8, 27 + 15 + damageHeight + 15);

      y = sectionTitle(doc, "4. INSPECTION NOTES", y);

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text("Damage Description", MARGIN, y);

      y += 15;

      const actualDamageHeight = drawText(
        doc,
        damage,
        MARGIN,
        y,
        CONTENT_WIDTH
      );

      y += actualDamageHeight + 15;

      // Move the return notes to the next page if necessary.
      doc.font("Helvetica").fontSize(8);

      const notesHeight = doc.heightOfString(notes, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });

      y = ensureSpace(doc, y, 15 + notesHeight + 24);

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text("Return Notes", MARGIN, y);

      y += 15;

      const actualNotesHeight = drawText(
        doc,
        notes,
        MARGIN,
        y,
        CONTENT_WIDTH
      );

      y += actualNotesHeight + 24;

      // ========================================================
      // ACKNOWLEDGEMENT
      // ========================================================

      const acknowledgement =
        "The signatures below acknowledge the recorded return " +
        "inspection and accessory quantities. Any damage charges, " +
        "missing-item charges, or security deposit deductions " +
        "remain subject to separate review and approval. " +
        "Signing does not automatically constitute acceptance " +
        "of disputed charges.";

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.secondary);

      const acknowledgementHeight = doc.heightOfString(
        acknowledgement,
        { width: CONTENT_WIDTH }
      );

      y = ensureSpace(doc, y, acknowledgementHeight + 95);

      doc.text(acknowledgement, MARGIN, y, {
        width: CONTENT_WIDTH,
      });

      y += acknowledgementHeight + 35;

      // ========================================================
      // SIGNATURES
      // ========================================================

      const gap = 28;
      const signatureWidth = (CONTENT_WIDTH - gap) / 2;
      const rightX = MARGIN + signatureWidth + gap;

      doc
        .strokeColor(COLORS.secondary)
        .moveTo(MARGIN, y + 20)
        .lineTo(MARGIN + signatureWidth, y + 20)
        .stroke();

      doc
        .moveTo(rightX, y + 20)
        .lineTo(rightX + signatureWidth, y + 20)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.text)
        .text("Customer Signature", MARGIN, y + 26)
        .text("Staff Signature", rightX, y + 26);

      doc
        .fontSize(7)
        .fillColor(COLORS.secondary)
        .text("Date: __________________", MARGIN, y + 42)
        .text("Date: __________________", rightX, y + 42);

      
      // ========================================================
      // FOOTERS AND PAGE NUMBERS
      // ========================================================

      const pageRange = doc.bufferedPageRange();
      const totalPages = pageRange.count;
console.log(
  "[Return PDF] Pages before footer rendering:",
  totalPages
);
      if (totalPages < 1) {
        throw new Error("No return acknowledgement pages generated.");
      }

      for (
        let pageIndex = pageRange.start;
        pageIndex < pageRange.start + totalPages;
        pageIndex++
      ) {
        doc.switchToPage(pageIndex);

        doc
          .strokeColor(COLORS.border)
          .lineWidth(0.8)
          .moveTo(MARGIN, PAGE_HEIGHT - 45)
          .lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 45)
          .stroke();

        doc.text(
        "Southern Camera Rent | Return Acknowledgement",
        MARGIN,
        PAGE_HEIGHT - 35,
        {
            width: CONTENT_WIDTH - 90,
            height: 12,
            lineBreak: false,
        }
        );

        doc.text(
        `Page ${pageIndex - pageRange.start + 1} of ${totalPages}`,
        PAGE_WIDTH - MARGIN - 85,
        PAGE_HEIGHT - 35,
        {
            width: 85,
            height: 12,
            align: "right",
            lineBreak: false,
        }
        );
      }

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateRentalReturnPdf,
};
