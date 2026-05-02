## Sistem Pemesanan UMKM Berbasis Microservices ##

# Identitas Diri
Nama: M. Fadlan Fadilah
NIM: 2410511052
Kelas: A


# Peta Routing

| HTTP Method | Endpoint Gateway (Pintu Masuk) | Target Layanan | Endpoint Asli | Keterangan / Middleware Gateway |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | **Auth Service** (Port 3001) | `/login` | Rate Limiter |
| `POST` | `/auth/logout` | **Auth Service** (Port 3001) | `/logout` | Rate Limiter, JWT Validation |
| `GET` | `/auth/google` | **Auth Service** (Port 3001) | `/google` | Rate Limiter |
| `GET` | `/auth/google/callback` | **Auth Service** (Port 3001) | `/google/callback`| Rate Limiter |
| `GET` | `/products` | **Product Service** (Port 3003) | `/products` | Rate Limiter |
| `POST` | `/products` | **Product Service** (Port 3003) | `/products` | Rate Limiter, JWT Validation |
| `POST` | `/orders` | **Order Service** (Port 3002) | `/orders` | Rate Limiter, JWT Validation |
| `GET` | `/orders/:id` | **Order Service** (Port 3002) | `/orders/:id` | Rate Limiter, JWT Validation |


# Instalasi & Cara Menjalankan Sistem

A. Kebutuhan Sistem
- Node.js (Minimal v16)
- MariaDB / MySQL
- Kredensial Google Cloud Console (Client ID & Client Secret)

B. Konfigurasi
1. Gandakan repositori ini.
2. Salin file konfigurasi di masing-masing layanan
3. Sesuaikan nilai di dalam setiap .env dengan pengaturan pangkalan data dan kredensial Anda.

C. Menjalankan Layanan
Disarankan untuk membuka terminal terpisah untuk setiap layanan dan menjalankannya secara berurutan.
1. Menjalankan Gateway
cd gateway
npm install
npm start

2. Menjalankan Microservices

- Terminal Auth-service
cd services/auth-service
npm install
npm start

- Terminal Order-service
cd services/order-service
npm install
npm start

- Terminal Product-service
cd services/product-service
npm install
npm start


# Video Demo
Link: https://youtu.be/Uw9BA1Ii4Mw
