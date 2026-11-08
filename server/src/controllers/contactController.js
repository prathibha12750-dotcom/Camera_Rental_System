
const sendEmail = require("../utils/sendEmail");

// ==========================================
// CONTACT FORM CONFIGURATION
// ==========================================

const inquiryTypes = {
  GENERAL: "General Inquiry",
  EQUIPMENT: "Equipment Rental",
  PHOTOGRAPHER: "Photographer Booking",
  PAYMENT: "Payments & Deposits",
  OTHER: "Other Inquiry",
};

// ==========================================
// ESCAPE HTML
// Prevent submitted content from being
// interpreted as HTML in received emails.
// ==========================================

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ==========================================
// SUBMIT CONTACT INQUIRY
// PUBLIC ENDPOINT
// ==========================================

const submitContactInquiry = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone = "",
      inquiryType = "GENERAL",
      message,
    } = req.body || {};

    // Validate data types before trimming.
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof inquiryType !== "string" ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact form data.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanMessage = message.trim();

    // ======================================
    // REQUIRED FIELD VALIDATION
    // ======================================

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields.",
      });
    }

    if (cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must not exceed 100 characters.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      cleanEmail.length > 254 ||
      !emailRegex.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (cleanPhone.length > 25) {
      return res.status(400).json({
        success: false,
        message: "Phone number is too long.",
      });
    }

    if (
      cleanMessage.length < 10 ||
      cleanMessage.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Message must contain between 10 and 2000 characters.",
      });
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        inquiryTypes,
        inquiryType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry type.",
      });
    }

    // ======================================
    // EMAIL CONFIGURATION
    // ======================================

    const businessEmail =
      process.env.CONTACT_RECEIVER_EMAIL ||
      process.env.EMAIL_USER;

    if (!businessEmail) {
      return res.status(503).json({
        success: false,
        message:
          "Contact service is temporarily unavailable.",
      });
    }

    const inquiryLabel = inquiryTypes[inquiryType];

    // ======================================
    // PLAIN TEXT EMAIL
    // ======================================

    const text = `
New Contact Inquiry - Southern Camera Rental

Inquiry Type: ${inquiryLabel}
Customer Name: ${cleanName}
Customer Email: ${cleanEmail}
Phone Number: ${cleanPhone || "Not provided"}

Message:
${cleanMessage}

---
Sent through the Southern Camera Rental Contact Us form.
`.trim();

    // ======================================
    // HTML EMAIL
    // ======================================

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1f2937;">
        <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;">
          <h2 style="color:#ffffff;margin:0;">
            Southern Camera Rental
          </h2>
          <p style="color:#fb923c;margin:8px 0 0;">
            New Contact Inquiry
          </p>
        </div>

        <div style="padding:24px;border:1px solid #e5e7eb;">
          <h3>${escapeHtml(inquiryLabel)}</h3>

          <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(cleanPhone || "Not provided")}</p>

          <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0;" />

          <h4>Customer Message</h4>

          <div style="background:#f9fafb;padding:16px;border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere;">${escapeHtml(cleanMessage)}</div>
        </div>

        <div style="background:#f3f4f6;padding:16px;text-align:center;border-radius:0 0 12px 12px;">
          <p style="font-size:12px;color:#6b7280;">
            Sent from the SCR Contact Us form.
          </p>
        </div>
      </div>
    `;

    // ======================================
    // SEND EMAIL
    // ======================================

    await sendEmail({
      to: businessEmail,
      subject: `SCR Contact: ${inquiryLabel}`,
      text,
      html,
      replyTo: cleanEmail,
    });

    return res.status(200).json({
      success: true,
      message:
        "Your message has been sent successfully. Thank you for contacting us!",
    });
  } catch (error) {
    // Avoid exposing SMTP credentials or
    // internal email errors to the client.
    console.error("Contact email delivery failed:", error.message);

    return res.status(502).json({
      success: false,
      message:
        "We couldn't send your message right now. Please try again later.",
    });
  }
};

module.exports = {
  submitContactInquiry,
};
