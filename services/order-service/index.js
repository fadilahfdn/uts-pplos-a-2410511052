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

app.post('/', async (req, res) => {
    try {
        const { user_email, product_id } = req.body;

        if (!user_email || !product_id) {
            return res.status(400).json({ message: "Email dan ID Produk wajib diisi!" });
        }

        const productResponse = await fetch(`http://localhost:3000/products?id=${product_id}`);
        
        if (!productResponse.ok) {
            return res.status(404).json({ message: "Produk tidak ditemukan di katalog." });
        }

        const productData = await productResponse.json();

        const itemName = productData.name; 
        const itemTotal = productData.price;

        // Simpan pesanan ke database umkm_orders
        const query = `INSERT INTO orders (user_email, item, total) VALUES (?, ?, ?)`;
        await dbPool.query(query, [user_email, itemName, itemTotal]);

        res.status(201).json({ 
            message: "Pesanan berhasil dibuat secara otomatis!",
            detail_pesanan: {
                item: itemName,
                total_harga: itemTotal
            }
        });

    } catch (error) {
        console.error("Error Sistem:", error);
        res.status(500).json({ message: "Gagal memproses pesanan otomatis", error: error.message });
    }
});

app.listen(3003, () => {
    console.log(`ORDER SERVICE berjalan di ${process.env.PORT} dan terhubung ke MySQL`);
});