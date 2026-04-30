require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user.id, email: user.email }, 
        process.env.JWT_REFRESH, 
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

// Register
app.post('/register', async (req, res) => {
    try {
        const { email, password, nama } = req.body;
        
        const [existingUser] = await dbPool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }

        // Enkripsi password (Hashing)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await dbPool.query(
            "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)", 
            [nama, email, hashedPassword, 'donatur']
        );
        
        res.status(201).json({ message: "User berhasil dibuat", userId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: "Gagal register", error: error.message });
    }
});

// Login Lokal
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await dbPool.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = users[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Email atau Password salah" });
        }

        const tokens = generateTokens(user);
        res.json({ message: "Login Berhasil", ...tokens });
    } catch (error) {
        res.status(500).json({ message: "Gagal login", error: error.message });
    }
});

// oatuh
app.get('/google', (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email`;
    res.redirect(url);
});

// callback menangkap code dari Google
app.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    res.json({ message: "Google OAuth Berhasil (Server menukar code)", auth_code: code });
});



app.listen(process.env.PORT, () => {
    console.log(`AUTH SERVICE Berjalan di port ${process.env.PORT}`);
});