const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3000;

const dbPool = mysql.createPool({
  host: "localhost",
  user: "root",       
  password: "",       
  database: "umkm_auth",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { 
        error: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 1 menit." 
    },
    standardHeaders: true, 
    legacyHeaders: false,
});
app.use(limiter);

const verifikasiToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Akses ditolak. Token tidak ada!" });

  try {
    
    const [results] = await dbPool.query(
      "SELECT * FROM token_blacklist WHERE token = ?", 
      [token]
    );

    if (results.length > 0) {
      return res.status(401).json({ error: "Sesi telah berakhir (Token Blacklisted). Silakan login kembali." });
    }

    jwt.verify(token, "rahasia_umkm_jwt", (err, decoded) => {
      if (err)
        return res.status(403).json({ error: "Token expired atau tidak valid." });
      
      req.user = decoded;
      req.headers['x-user-info'] = JSON.stringify(decoded);
      
      next();
    });

  } catch (error) {
    console.error("Database Error pada Gateway:", error);
    return res.status(500).json({ error: "Terjadi kesalahan internal pada Gateway saat memverifikasi sesi." });
  }
};

// Service Auth
app.use('/auth', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));

// Service Produk PHP
app.use('/products', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));

// Service Pesanan
app.use('/orders', verifikasiToken, createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));


app.listen(PORT, () => {
    console.log(`GATEWAY Aktif di port ${PORT}`);
});