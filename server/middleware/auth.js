const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  // 2. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_fallback_secret_123");
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: "Token is not valid" });
  }
};

module.exports = authMiddleware;
