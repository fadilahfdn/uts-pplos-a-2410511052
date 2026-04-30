const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: "Trafik penuh, tunggu sebentar." },
});
app.use(limiter);

const verifikasiToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Akses ditolak. Token tidak ada!" });

  jwt.verify(token, "rahasia_umkm_jwt", (err, decoded) => {
    if (err)
      return res.status(403).json({ error: "Token expired atau tidak valid." });
    req.user = decoded;

    req.headers['x-user-info'] = JSON.stringify(decoded);
    
    next();
  });
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