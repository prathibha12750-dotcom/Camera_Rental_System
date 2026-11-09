
const nodemailer = require("nodemailer");

// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// ==========================================
// SEND EMAIL
// ==========================================

const sendEmail = async ({
  to,
  subject,
  html,
  text,
  replyTo,
}) => {
  const mailOptions = {
    from: `"Southern Camera Rental" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  // Optional customer reply-to address.
  // Existing email functionality remains unchanged.
  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }

  const info = await transporter.sendMail(mailOptions);

  return info;
};

module.exports = sendEmail;
