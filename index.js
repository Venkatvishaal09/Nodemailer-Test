require("dotenv").config({ quiet: true });
const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// ─── File upload setup (for attachments) ──────────────────────────
const upload = multer({
  dest: path.join(__dirname, "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ─── 1. TRANSPORTER (created once at startup, using OAuth2) ────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Log whenever Nodemailer generates a fresh access token using the refresh token
transporter.on("token", (token) => {
  console.log(" New access token generated for", token.user);
});

// Verify connection as soon as the server starts
transporter
  .verify()
  .then(() => console.log(" Transporter ready — server can send emails"))
  .catch((err) => console.error(" Transporter config error:", err.message));

// ─── Route: handle contact form submission ────────────────────────
// upload.single('attachment') reads one optional file field named "attachment"
app.post("/send", upload.single("attachment"), async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Name, email, and message are required.",
      });
  }

  // ─── 2. MAIL OPTIONS — admin notification ───────────────────────
  const adminMailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: process.env.RECEIVER,
    subject: `New message from ${name}`,
    text: `From: ${name} (${email})\n\n${message}`,
    html: `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/>${message}</p>
    `,
    // Attachment is included only if a file was uploaded
    attachments: req.file
      ? [{ filename: req.file.originalname, path: req.file.path }]
      : [],
  };

  // ─── 2. MAIL OPTIONS — auto-reply to the sender ─────────────────
  const autoReplyOptions = {
    from: `"Contact Mailer" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "We received your message",
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for reaching out — we've received your message and will get back to you soon.</p>
      <p><em>Your message:</em> "${message}"</p>
    `,
  };

  // ─── 3. SEND ─────────────────────────────────────────────────────
  try {
    const adminInfo = await transporter.sendMail(adminMailOptions);
    const replyInfo = await transporter.sendMail(autoReplyOptions);

    res.json({
      success: true,
      adminMessageId: adminInfo.messageId,
      replyMessageId: replyInfo.messageId,
    });
  } catch (err) {
    console.error(err);

    let userMessage = "Failed to send email. Please try again later.";
    switch (err.code) {
      case "EAUTH":
        userMessage = "Email server rejected the login credentials.";
        break;
      case "ECONNECTION":
      case "ETIMEDOUT":
        userMessage = "Could not connect to the email server. Try again.";
        break;
      case "EENVELOPE":
        userMessage = "Invalid sender or recipient address.";
        break;
    }

    res.status(500).json({ success: false, error: userMessage });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`),
);
