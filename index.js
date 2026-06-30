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
  console.log("🔄 New access token generated for", token.user);
});

// Verify connection as soon as the server starts
transporter
  .verify()
  .then(() => console.log("✅ Transporter ready — server can send emails"))
  .catch((err) => console.error("❌ Transporter config error:", err.message));

// ─── Route: handle email sending (supports bulk) ────────────────────
// The front-end sends one email at a time in a loop, so this endpoint
// handles a single recipient per request. The "subject" and HTML "message"
// fields support the new bulk email UI.
app.post("/send", upload.single("attachment"), async (req, res) => {
  const { name, email, subject, message, replyTo } = req.body;

  if (!email || !message) {
    return res.status(400).json({
      success: false,
      error: "Email and message are required.",
    });
  }

  // ─── 2. MAIL OPTIONS ───────────────────────────────────────
  const mailOptions = {
    from: `"${name || "Nodemailer Test"}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject || `Message from ${name || "Nodemailer Test"}`,
    html: message,
    // Plain text fallback (strip HTML tags)
    text: message.replace(/<[^>]*>/g, ""),
    // Attachment is included only if a file was uploaded
    attachments: req.file
      ? [{ filename: req.file.originalname, path: req.file.path }]
      : [],
  };

  // Add reply-to if provided
  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }

  // ─── 3. SEND ─────────────────────────────────────────────
  try {
    const info = await transporter.sendMail(mailOptions);

    console.log(`📧 Sent to ${email} — messageId: ${info.messageId}`);

    res.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error(`❌ Failed to send to ${email}:`, err.message);

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

const PORT = process.env.PORT || 3005;
app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`),
);
