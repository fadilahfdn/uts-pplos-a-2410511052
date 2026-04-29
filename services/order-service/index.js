const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let ordersDB = [
    { id: 1, user_email: "donatur@contoh.com", item: "Kripik Tempe Premium", total: 15000, status: "Diproses" }
];

app.get('/', (req, res) => {
    
    const userHeader = req.headers['x-user-info'];
    
    if (!userHeader) {
        return res.status(403).json({ message: "Akses Ditolak. Anda belum login!" });
    }

    const user = JSON.parse(userHeader);
    
    const myOrders = ordersDB.filter(order => order.user_email === user.email);

    res.json({
        message: "Data Pesanan Berhasil Diambil",
        pembeli: user.nama,
        data: myOrders
    });
});

app.listen(3003, () => {
    console.log(`ORDER SERVICE berjalan di port 3003`);
});