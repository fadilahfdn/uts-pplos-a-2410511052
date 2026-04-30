require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());
app.use(cors());

const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

app.get('/', async (req, res) => {
    try {
    const userHeader = req.headers['x-user-info'];
    
    if (!userHeader) {
        return res.status(403).json({ message: "Akses Ditolak. Anda belum login!" });
    }

    const user = JSON.parse(userHeader);
    
    // berdasarkan email user yg login
    const [myOrders] = await dbPool.query(
            "SELECT id, item, total, status, created_at FROM orders WHERE user_email = ?", 
            [user.email]
        );

    res.json({
        message: "Data Pesanan Berhasil Diambil",
        pembeli: user.nama,
        jumlah_pesanan: myOrders.length,
        data: myOrders
    });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
    }
});

app.listen(3003, () => {
    console.log(`ORDER SERVICE berjalan di ${process.env.PORT} dan terhubung ke MySQL`);
});