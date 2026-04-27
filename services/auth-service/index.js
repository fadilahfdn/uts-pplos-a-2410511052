require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

let usersDB = [];

// Register
app.post('/register', async (req, res) => {
    try {
        const { email, password, nama } = req.body;
        
        if (usersDB.find(u => u.email === email)) {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }

        // Enkripsi password (Hashing)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = { 
            id: usersDB.length + 1, 
            nama, 
            email, 
            password: hashedPassword,
            role: 'donatur'
        };
        
        usersDB.push(newUser);
        res.status(201).json({ message: "User berhasil dibuat", userId: newUser.id });
    } catch (error) {
        res.status(500).json({ message: "Gagal register", error: error.message });
    }
});

// Login Lokal
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = usersDB.find(u => u.email === email);

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
    if (!code) return res.status(400).json({ error: "Code tidak ditemukan" });

    try {
       
        res.json({ 
            message: "Google OAuth Berhasil (Simulasi)", 
            info: "Di tahap ini, server menukar code dengan profile user",
            auth_code: code 
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal proses OAuth" });
    }
});



app.listen(process.env.PORT, () => {
    console.log(`AUTH SERVICE Berjalan di port ${process.env.PORT}`);
});