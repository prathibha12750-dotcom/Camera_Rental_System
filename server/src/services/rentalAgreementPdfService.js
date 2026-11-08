const PDFDocument = require("pdfkit");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  primary: "#172B4D",
  secondary: "#526477",
  border: "#D8E0E8",
  light: "#F3F6FA",
  text: "#1F2937",
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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

const formatMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "-";

  return `LKR ${number.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const clean = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
};

const sectionTitle = (doc, title, y) => {
  doc
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title, MARGIN, y);

  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .moveTo(MARGIN, y + 17)
    .lineTo(PAGE_WIDTH - MARGIN, y + 17)
    .stroke();

  return y + 26;
};

const field = (doc, label, value, x, y, width) => {
  doc
    .fillColor(COLORS.secondary)
    .font("Helvetica")
    .fontSize(7.5)
    .text(label, x, y, { width });

  doc
    .fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(clean(value), x, y + 11, {
      width,
      height: 27,
      ellipsis: true,
    });
};

const twoFields = (
  doc,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  y
) => {
  const gap = 16;
  const width = (CONTENT_WIDTH - gap) / 2;

  field(doc, leftLabel, leftValue, MARGIN, y, width);

  field(
    doc,
    rightLabel,
    rightValue,
    MARGIN + width + gap,
    y,
    width
  );

  return y + 30;
};

const drawHeader = (doc, agreement, pageNumber, subtitle) => {
  doc
    .rect(0, 0, PAGE_WIDTH, 78)
    .fill(COLORS.primary);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("SOUTHERN CAMERA RENT", MARGIN, 19);

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(subtitle, MARGIN, 43);

  doc
    .fontSize(8)
    .text(
      `Page ${pageNumber} of 2`,
      PAGE_WIDTH - MARGIN - 95,
      26,
      { width: 95, align: "right" }
    );

  doc
    .fillColor(COLORS.secondary)
    .font("Helvetica")
    .fontSize(8)
    .text(
      `Agreement: ${clean(agreement.agreementNumber)}`,
      MARGIN,
      88
    );

  doc.text(
    `Rental ID: ${clean(agreement.rental)}`,
    MARGIN,
    100
  );
};

const drawFooter = (doc) => {
  doc
    .strokeColor(COLORS.border)
    .moveTo(MARGIN, PAGE_HEIGHT - 37)
    .lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 37)
    .stroke();

  doc
    .fillColor(COLORS.secondary)
    .font("Helvetica")
    .fontSize(7)
    .text(
      "Southern Camera Rent | Rental Agreement",
      MARGIN,
      PAGE_HEIGHT - 29,
      {
        width: CONTENT_WIDTH,
        align: "center",
      }
    );
};

const signatureBlock = (doc, y, leftTitle, rightTitle) => {
  const gap = 28;
  const width = (CONTENT_WIDTH - gap) / 2;

  const rightX = MARGIN + width + gap;

  doc
    .strokeColor(COLORS.secondary)
    .moveTo(MARGIN, y + 25)
    .lineTo(MARGIN + width, y + 25)
    .stroke();

  doc
    .moveTo(rightX, y + 25)
    .lineTo(rightX + width, y + 25)
    .stroke();

  doc
    .fillColor(COLORS.text)
    .font("Helvetica")
    .fontSize(8)
    .text(leftTitle, MARGIN, y + 30, { width })
    .text(rightTitle, rightX, y + 30, { width });

  doc
    .fontSize(7)
    .fillColor(COLORS.secondary)
    .text("Date / Time: __________________", MARGIN, y + 45)
    .text("Date / Time: __________________", rightX, y + 45);

  return y + 65;
};

const drawReturnAccessoryChecklist = (doc, accessories, y) => {
  const rows = Array.isArray(accessories) ? accessories : [];

  const x = MARGIN;
  const tableWidth = CONTENT_WIDTH;

  const columns = [
    { title: "Accessory", width: 170 },
    { title: "Issued", width: 48 },
    { title: "Returned", width: 58 },
    { title: "Condition", width: 95 },
    { title: "Remarks", width: tableWidth - 371 },
  ];

  const headerHeight = 23;
  const rowHeight = 25;

  const drawCellText = (text, cellX, cellY, width, options = {}) => {
    doc
      .font(options.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(options.fontSize || 7.5)
      .fillColor(options.color || COLORS.text)
        .text(text, cellX + 5, cellY + 5, {
        width: width - 10,
        height: rowHeight - 8,
        ellipsis: true,
        align: options.align || "left",
        });
  };

  const drawRowBorder = (rowY, height) => {
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.7)
      .rect(x, rowY, tableWidth, height)
      .stroke();

    let columnX = x;

    columns.slice(0, -1).forEach((column) => {
      columnX += column.width;

      doc
        .moveTo(columnX, rowY)
        .lineTo(columnX, rowY + height)
        .stroke();
    });
  };

  // Table header
  doc
    .rect(x, y, tableWidth, headerHeight)
    .fill(COLORS.light);

  drawRowBorder(y, headerHeight);

  let columnX = x;

  columns.forEach((column) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(COLORS.primary)
      .text(column.title, columnX + 5, y + 8, {
        width: column.width - 10,
        align: column.title === "Issued" ? "center" : "left",
      });

    columnX += column.width;
  });

  y += headerHeight;

  // Original issued accessories
  rows.forEach((accessory) => {
    drawRowBorder(y, rowHeight);

    let cellX = x;

    drawCellText(
      String(accessory.name || "-"),
      cellX,
      y,
      columns[0].width
    );

    cellX += columns[0].width;

    drawCellText(
      String(accessory.quantity ?? 0),
      cellX,
      y,
      columns[1].width,
      { align: "center", bold: true }
    );

    // Returned quantity, condition and remarks
    // intentionally remain blank for handwritten inspection.

    y += rowHeight;
  });

  if (rows.length === 0) {
    drawRowBorder(y, rowHeight);

    drawCellText(
      "No accessories recorded at handover",
      x,
      y,
      columns[0].width
    );

    y += rowHeight;
  }

  return y;
};

const drawInspection = (doc, inspection, y) => {
  const condition = inspection?.condition || "Not recorded";

  y = twoFields(
    doc,
    "Equipment condition",
    condition,
    "Inspection date",
    inspection?.inspectedAt
      ? formatDateTime(inspection.inspectedAt)
      : "________________",
    y
  );

  const accessories = inspection?.accessories || [];

    const accessoryText = accessories.length
    ? accessories
        .map((item) => {
            const condition = item.condition
            ? ` [${item.condition}]`
            : "";

            const suffix = item.notes
            ? ` (${item.notes})`
            : "";

            return `${item.name} x${item.quantity}${condition}${suffix}`;
        })
        .join("; ")
    : "None recorded";

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.secondary)
    .text("Included accessories", MARGIN, y);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.text)
    .text(accessoryText, MARGIN, y + 12, {
      width: CONTENT_WIDTH,
      height: 28,
      ellipsis: true,
    });

  y += 46;

  doc
    .fillColor(COLORS.secondary)
    .fontSize(8)
    .text("Existing damage / observations", MARGIN, y);

const damageText =
  inspection?.damageDescription?.trim() || "None recorded";

const inspectionNotes =
  inspection?.notes?.trim() || "None recorded";

const observationText =
  `Existing damage: ${damageText}\n` +
  `Inspection notes: ${inspectionNotes}`;

doc
  .fillColor(COLORS.text)
  .font("Helvetica")
  .fontSize(8)
  .text(observationText, MARGIN, y + 12, {
    width: CONTENT_WIDTH,
    height: 30,
    ellipsis: true,
  });

  return y + 49;
};

// ==========================================
// PAGE 1 - HANDOVER AGREEMENT
// ==========================================

const drawPageOne = (doc, agreement) => {
  const snapshot = agreement.rentalSnapshot || {};

  drawHeader(
    doc,
    agreement,
    1,
    "EQUIPMENT RENTAL & HANDOVER AGREEMENT"
  );

  let y = 123;

  // ==========================================
  // CUSTOMER & EQUIPMENT DETAILS
  // ==========================================

  y = sectionTitle(
    doc,
    "1. CUSTOMER & EQUIPMENT DETAILS",
    y
  );

  y = twoFields(
    doc,
    "Customer name",
    snapshot.customerName,
    "Equipment",
    snapshot.equipmentName,
    y
  );

  y = twoFields(
    doc,
    "Brand / Model",
    `${clean(snapshot.brand)} / ${clean(snapshot.model)}`,
    "Serial number",
    snapshot.serialNumber,
    y
  );

  // ==========================================
  // RENTAL & PAYMENT DETAILS
  // ==========================================

  y = sectionTitle(
    doc,
    "2. RENTAL & PAYMENT DETAILS",
    y
  );

  y = twoFields(
    doc,
    "Rental start",
    formatDateTime(snapshot.startDate),
    "Return deadline",
    formatDateTime(snapshot.endDate),
    y
  );

  y = twoFields(
    doc,
    "Rental amount",
    formatMoney(snapshot.rentalAmount),
    "Security deposit",
    formatMoney(snapshot.securityDeposit),
    y
  );

  y = twoFields(
    doc,
    "Overdue penalty rate",
    `${clean(snapshot.overduePenaltyRate)}%`,
    "Overdue penalty per day",
    formatMoney(snapshot.overduePenaltyPerDay),
    y
  );

  // ==========================================
  // HANDOVER INSPECTION
  // ==========================================

  y = sectionTitle(
    doc,
    "3. EQUIPMENT HANDOVER INSPECTION",
    y
  );

  y = drawInspection(
    doc,
    agreement.handoverInspection,
    y
  );

  // ==========================================
  // STANDARD RENTAL TERMS
  // ==========================================

  y = sectionTitle(
    doc,
    "4. STANDARD RENTAL TERMS",
    y
  );

  const terms = agreement.termsSnapshot || [];

  const columnGap = 16;
  const columnWidth = (CONTENT_WIDTH - columnGap) / 2;

  const leftX = MARGIN;
  const rightX = MARGIN + columnWidth + columnGap;

  const termsStartY = y;
  const termsBottomLimit = 715;

  let leftY = termsStartY;
  let rightY = termsStartY;

  const midpoint = Math.ceil(terms.length / 2);

  const drawTerm = (term, index, x, currentY) => {
    const content = `${index + 1}. ${term}`;

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.text);

    const height = doc.heightOfString(content, {
      width: columnWidth,
      lineGap: 1,
    });

    if (currentY + height + 7 > termsBottomLimit) {
      throw new Error(
        "Agreement terms exceed available page space."
      );
    }

    doc.text(content, x, currentY, {
      width: columnWidth,
      lineGap: 1,
    });

    return currentY + height + 7;
  };

  terms.forEach((term, index) => {
    if (index < midpoint) {
      leftY = drawTerm(term, index, leftX, leftY);
    } else {
      rightY = drawTerm(term, index, rightX, rightY);
    }
  });

  y = Math.max(leftY, rightY) + 12;

  // ==========================================
  // SPECIAL NOTES
  // ==========================================

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.primary)
    .text("Special notes:", MARGIN, y);

  y += 13;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.text)
    .text(clean(agreement.specialNotes), MARGIN, y, {
      width: CONTENT_WIDTH,
      height: 25,
      ellipsis: true,
    });

  // ==========================================
  // HANDOVER SIGNATURES
  // ==========================================

  const signatureY = y + 36;

  // Keep signatures above the footer.
  const signatureBottomLimit = PAGE_HEIGHT - 48;

  if (signatureY + 65 > signatureBottomLimit) {
    throw new Error(
      `Page 1 content is too long. Signatures need to end at ${
        signatureY + 65
      }, but the available limit is ${signatureBottomLimit}.`
    );
  }

  signatureBlock(
    doc,
    signatureY,
    "Customer signature (handover)",
    "Staff signature (handover)"
  );

  drawFooter(doc);
};

// ==========================================
// PAGE 2 - RETURN ACKNOWLEDGEMENT
// ==========================================

const drawPageTwo = (doc, agreement) => {
  drawHeader(
    doc,
    agreement,
    2,
    "EQUIPMENT RETURN & ACKNOWLEDGEMENT"
  );

  let y = 135;

  y = sectionTitle(doc, "1. RENTAL REFERENCE", y);

  y = twoFields(
    doc,
    "Customer name",
    agreement.rentalSnapshot?.customerName,
    "Equipment",
    agreement.rentalSnapshot?.equipmentName,
    y
  );

  y = twoFields(
    doc,
    "Equipment serial number",
    agreement.rentalSnapshot?.serialNumber,
    "Agreement number",
    agreement.agreementNumber,
    y
  );

  y = sectionTitle(doc, "2. EQUIPMENT RETURN INSPECTION", y + 10);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      "Actual return date / time: ___________________________________",
      MARGIN,
      y
    );

  y += 18;

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(
      "Returned condition:  [ ] Excellent   [ ] Good   [ ] Fair   [ ] Damaged",
      MARGIN,
      y
    );

  y += 18;

    doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.primary)
    .text("ACCESSORY RETURN CHECKLIST", MARGIN, y);

    y += 17;

    // Use the original handover accessories.
    // Do not use returnInspection here because this PDF
    // is generated before the equipment is issued.
    const issuedAccessories =
    agreement.handoverInspection?.accessories || [];

    const checklistRows = Math.max(issuedAccessories.length, 1);

    const estimatedChecklistHeight =
    23 + checklistRows * 25;

    // Reserve space for all sections below the checklist.
    const reservedLowerSectionHeight =
    7 +  // Space after checklist
    3 +  // Space before damage section
    26 + // Damage section heading
    20 + // Damage description label
    40 + // Two damage writing lines
    3 +  // Space before return notes
    26 + // Return notes heading
    38 + // Two return-note lines
    6 +  // Space before acknowledgement
    12 + // Acknowledgement spacing
    5 +  // Space before signatures
    65;  // Signature block

    const returnSignatureBottomLimit = PAGE_HEIGHT - 48;

    const checklistBottomLimit =
    returnSignatureBottomLimit - reservedLowerSectionHeight;

    if (y + estimatedChecklistHeight > checklistBottomLimit) {
    throw new Error(
        `The return accessory checklist has ${issuedAccessories.length} ` +
        "accessories and cannot fit in the two-page agreement. " +
        "Reduce the accessory list or revise the PDF layout."
    );
    }

    y = drawReturnAccessoryChecklist(
    doc,
    issuedAccessories,
    y
    );

    y += 7;

  y = sectionTitle(doc, "3. DAMAGE & CONDITION COMPARISON", y + 3);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text("New damage / differences from handover condition:", MARGIN, y);

  y += 20;

    for (let i = 0; i < 2; i++) {
    doc
        .strokeColor(COLORS.border)
        .moveTo(MARGIN, y + 14)
        .lineTo(PAGE_WIDTH - MARGIN, y + 14)
        .stroke();

    y += 20;
    }

  y = sectionTitle(doc, "4. RETURN NOTES", y + 3);

    for (let i = 0; i < 2; i++) {
    doc
        .strokeColor(COLORS.border)
        .moveTo(MARGIN, y + 14)
        .lineTo(PAGE_WIDTH - MARGIN, y + 14)
        .stroke();

    y += 19;
    }

  y += 6;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.secondary)
    .text(
      "Signatures acknowledge the recorded return inspection. " +
        "Any damage charges or deposit deductions remain subject " +
        "to the separate review and settlement process.",
      MARGIN,
      y,
      { width: CONTENT_WIDTH }
    );

y += 12;

// Keep signatures below the acknowledgement text.
const returnSignatureY = y + 5;

if (
  returnSignatureY + 65 >
  returnSignatureBottomLimit
) {
  throw new Error(
    "Page 2 content is too long. The accessory checklist, " +
      "damage inspection, return notes and signatures " +
      "cannot fit on one A4 page. " +
      "Revise the layout before generating this agreement."
  );
}

signatureBlock(
  doc,
  returnSignatureY,
  "Customer signature (return)",
  "Staff signature (return)"
);

  drawFooter(doc);
};

const validateAgreementPdfContent = (agreement) => {
  const inspection = agreement.handoverInspection;

  if (!inspection?.condition || !inspection?.inspectedAt) {
    throw new Error(
      "Complete the handover inspection before generating the PDF."
    );
  }

  const measure = (text, fontSize, width) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 42,
    });

    doc.font("Helvetica").fontSize(fontSize);

    const height = doc.heightOfString(text || "-", {
      width,
    });

    doc.end();

    return height;
  };

  const accessories = inspection.accessories || [];

// Validate accessory names against the return checklist cells.
// The accessory column is 170 points wide with 5-point
// padding on each side. Each row is 25 points high.
const accessoryNameWidth = 160;
const accessoryNameMaxHeight = 17;

for (const [index, accessory] of accessories.entries()) {
  const name = String(accessory.name || "").trim();

  if (!name) {
    throw new Error(
      `Accessory ${index + 1} must have a name.`
    );
  }

const quantity = Number(accessory.quantity);

if (
  !Number.isSafeInteger(quantity) ||
  quantity < 1
) {
  throw new Error(
    `Accessory ${index + 1} must have a valid positive integer quantity.`
  );
}

// The issued quantity column is 48 points wide,
// with 5-point padding on each side.
const quantityText = String(quantity);

const quantityHeight = measure(
  quantityText,
  7.5,
  38
);

if (quantityHeight > 17) {
  throw new Error(
    `Accessory ${index + 1} quantity is too large ` +
    "to display in the return checklist."
  );
}

  const actualHeight = measure(
    name,
    7.5,
    accessoryNameWidth
  );

  if (actualHeight > accessoryNameMaxHeight) {
    throw new Error(
      `Accessory ${index + 1} name is too long ` +
      "for the return checklist. Use a shorter, " +
      "clearly identifiable name."
    );
  }
}

  const accessoryText = accessories.length
    ? accessories
        .map((item) => {
            const condition = item.condition
            ? ` [${item.condition}]`
            : "";

            const suffix = item.notes
            ? ` (${item.notes})`
            : "";

            return `${item.name} x${item.quantity}${condition}${suffix}`;
        })
        .join("; ")
    : "None recorded";

    const observations =
    `Existing damage: ${
        inspection.damageDescription?.trim() || "None recorded"
    }\nInspection notes: ${
        inspection.notes?.trim() || "None recorded"
    }`;

  const specialNotes = agreement.specialNotes || "-";

  // ============================================================
  // VALIDATE CUSTOMER, EQUIPMENT AND AGREEMENT FIELDS
  // ============================================================

  const snapshot = agreement.rentalSnapshot || {};

  const fieldGap = 16;
  const fieldWidth = (CONTENT_WIDTH - fieldGap) / 2;

  const requiredFields = [
    ["Customer name", snapshot.customerName],
    ["Equipment name", snapshot.equipmentName],
    [
      "Brand / Model",
      `${clean(snapshot.brand)} / ${clean(snapshot.model)}`,
    ],
    ["Serial number", snapshot.serialNumber],
    ["Agreement number", agreement.agreementNumber],
  ];

  for (const [label, value] of requiredFields) {
    const text = clean(value);

    const actualHeight = measure(text, 9, fieldWidth);

    if (actualHeight > 27) {
      throw new Error(
        `${label} exceed available PDF space. Shorten the text before generating.`
      );
    }
  }

  const limits = [
    {
      label: "Accessories",
      text: accessoryText,
      width: CONTENT_WIDTH,
      fontSize: 8,
      maxHeight: 28,
    },
    {
      label: "Existing damage / observations",
      text: observations,
      width: CONTENT_WIDTH,
      fontSize: 8,
      maxHeight: 30,
    },
    {
      label: "Special notes",
      text: specialNotes,
      width: CONTENT_WIDTH,
      fontSize: 8,
      maxHeight: 25,
    },
  ];

  for (const item of limits) {
    const actualHeight = measure(
      item.text,
      item.fontSize,
      item.width
    );

    if (actualHeight > item.maxHeight) {
      throw new Error(
        `${item.label} exceed available PDF space. Shorten the text before generating.`
      );
    }
  }
};


 // ==========================================
 // GENERATE PDF BUFFER
 // ==========================================

const generateRentalAgreementPdf = (agreement) => {
  return new Promise((resolve, reject) => {
    let doc = null;
    let settled = false;

    const fail = (error) => {
      if (settled) return;

      settled = true;

      if (doc && !doc.destroyed) {
        doc.destroy();
      }

      reject(error);
    };

    try {
      // Validate all content before creating the PDF.
      validateAgreementPdfContent(agreement);

      doc = new PDFDocument({
        size: "A4",

        margins: {
          top: 42,
          bottom: 0,
          left: 42,
          right: 42,
        },

        autoFirstPage: false,
        bufferPages: true,

        info: {
          Title: `Rental Agreement ${agreement.agreementNumber}`,
          Author: "Southern Camera Rent",
          Subject: "Equipment Rental Agreement and Return Record",
        },
      });

      const chunks = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("error", fail);

      doc.on("end", () => {
        if (settled) return;

        settled = true;
        resolve(Buffer.concat(chunks));
      });

      // ==========================================
      // PAGE 1 - HANDOVER
      // ==========================================

      doc.addPage();
      drawPageOne(doc, agreement);

      const pagesAfterHandover =
        doc.bufferedPageRange().count;

      if (pagesAfterHandover !== 1) {
        throw new Error(
          `Handover section generated ${pagesAfterHandover} ` +
          "pages instead of 1."
        );
      }

      // ==========================================
      // PAGE 2 - RETURN
      // ==========================================

      doc.addPage();
      drawPageTwo(doc, agreement);

      const pagesAfterReturn =
        doc.bufferedPageRange().count;

      if (pagesAfterReturn !== 2) {
        throw new Error(
          `Return section caused the PDF to contain ` +
          `${pagesAfterReturn} pages instead of 2.`
        );
      }

      // Finalize the document.
      doc.end();
    } catch (error) {
      fail(error);
    }
  });
};

module.exports = {
  generateRentalAgreementPdf,
};
