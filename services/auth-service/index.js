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

// Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await dbPool.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = users[0];

        if (!user) {
            
            return res.status(401).json({ message: "Email atau Password salah" });
        }

        if (user.password === null || user.oauth_provider !== null) {
            return res.status(400).json({ 
                message: `Akun ini terdaftar menggunakan ${user.oauth_provider}. Silakan gunakan fitur Login with ${user.oauth_provider}.` 
            });
        }

        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Email atau Password salah" });
        }

        const tokens = generateTokens(user);
        res.json({ message: "Login Berhasil", ...tokens });
    } catch (error) {
        res.status(500).json({ message: "Gagal login", error: error.message });
    }
});

app.post('/refresh', (req, res) => {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
        return res.status(401).json({ message: "Refresh token diperlukan" });
    }

    jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Refresh token tidak valid atau kedaluwarsa" });

        const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({ access_token: newAccessToken });
    });
});

app.post('/logout', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(400).json({ message: "Token tidak ditemukan" });

    try {

        const sql = "INSERT INTO token_blacklist (token) VALUES (?)";
        await dbPool.query(sql, [token]);

        res.status(200).json({ message: "Logout berhasil, token telah diblokir" });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
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

    if (!code) {
        return res.status(400).json({ error: "Authorization code tidak ditemukan atau ditolak oleh pengguna." });
    }

    try {
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET, 
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return res.status(401).json({ error: "Gagal menukar kode otorisasi", detail: tokenData.error });
        }

        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const profileData = await profileResponse.json();

        const { email, name, picture } = profileData;

        const [users] = await dbPool.query("SELECT * FROM users WHERE email = ?", [email]);
        let user = users[0];

        if (!user) {
            // User belum ada. Buat otomatis (Auto-Register)
            const insertSql = "INSERT INTO users (nama, email, foto_profil, oauth_provider) VALUES (?, ?, ?, ?)";
            const [result] = await dbPool.query(insertSql, [name, email, picture, 'google']);
            const [newUsers] = await dbPool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
            user = newUsers[0];
        } else if (user.oauth_provider !== 'google') {
            await dbPool.query("UPDATE users SET foto_profil = ?, oauth_provider = 'google' WHERE email = ?", [picture, email]);
            user.foto_profil = picture;
            user.oauth_provider = 'google';
        }

        const localTokens = generateTokens(user); 
        
        res.json({
            message: "Login OAuth Google Berhasil",
            user: { 
                nama: user.nama, 
                email: user.email, 
                foto: user.foto_profil,
                provider: user.oauth_provider 
            },
            ...localTokens
        });

    } catch (error) {
        console.error("OAuth Internal Error:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal saat memproses otentikasi OAuth", error: error.message });
    }
});



app.listen(process.env.PORT, () => {
    console.log(`AUTH SERVICE Berjalan di port ${process.env.PORT}`);
});