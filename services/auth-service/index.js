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

// 2. Endpoint Login Lokal
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

app.listen(process.env.PORT, () => {
    console.log(`AUTH SERVICE Berjalan di port ${process.env.PORT}`);
});