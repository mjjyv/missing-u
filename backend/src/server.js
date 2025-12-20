// backend/src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 1. Import các Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// 2. Middleware
app.use(cors());
app.use(express.json()); // Rất quan trọng để đọc dữ liệu JSON từ Postman gửi lên

// 3. Sử dụng Routes với Prefix tương ứng
// Khi đó: /register trong authRoutes sẽ trở thành /api/auth/register
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Test Route (Health Check)
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));