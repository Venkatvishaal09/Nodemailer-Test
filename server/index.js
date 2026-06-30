require("dotenv").config({ path: require("path").resolve(__dirname, "../.env"), quiet: true });
const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const db = require("./db");
const authMiddleware = require("./middleware/auth");
const authRoutes = require("./routes/auth");

db.initDB();

const app = express();
app.use(express.json());

const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));

app.use("/api/auth", authRoutes);

const upload = multer({
  dest: "/tmp",
  limits: { fileSize: 5 * 1024 * 1024 },
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.on("token", (token) => {
  console.log(" New access token generated for", token.user);
});

transporter
  .verify()
  .then(() => console.log("✅ Transporter ready — server can send emails"))
  .catch((err) => console.error("❌ Transporter config error:", err.message));

app.post("/send", authMiddleware, upload.single("attachment"), async (req, res) => {
  const { name, email, subject, message, replyTo } = req.body;

  if (!email || !message) {
    return res.status(400).json({
      success: false,
      error: "Email and message are required.",
    });
  }

  const mailOptions = {
    from: `"${name || "Nodemailer Test"}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject || `Message from ${name || "Nodemailer Test"}`,
    html: message,
    text: message.replace(/<[^>]*>/g, ""),
    attachments: req.file
      ? [{ filename: req.file.originalname, path: req.file.path }]
      : [],
  };

  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }

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

app.get("{*splat}", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`),
);

setInterval(() => {}, 1000 * 60 * 60); // Keep event loop alive


module.exports = app;
