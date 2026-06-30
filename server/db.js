const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Require SSL in production environments like Neon/Supabase
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const initDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("⚠️ DATABASE_URL is not set. Database features will not work.");
      return;
    }
    
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ PostgreSQL connected and initialized");
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
  }
};

module.exports = {
  pool,
  initDB,
  query: (text, params) => pool.query(text, params),
};
