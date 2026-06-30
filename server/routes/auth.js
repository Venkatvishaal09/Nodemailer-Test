const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "default_fallback_secret_123";

// @route   POST /api/auth/register
// @desc    Register a new user
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Please enter all fields" });
  }

  try {
    // Check for existing user
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const insertResult = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );
    const user = insertResult.rows[0];

    // Create JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email },
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Please enter all fields" });
  }

  try {
    // Check for existing user
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }
    const user = userResult.rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }

    // Create JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email },
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
