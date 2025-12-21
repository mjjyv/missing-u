const express = require('express');
const http = require('http'); // [MỚI]
const { Server } = require('socket.io'); // [MỚI]
const cors = require('cors');
const pool = require('./config/db');
require('dotenv').config();

// Routes Imports
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const userRoutes = require('./routes/userRoutes');
const claimRoutes = require('./routes/claimRoutes');
const chatRoutes = require('./routes/chatRoutes'); // [MỚI]

const app = express();
const server = http.createServer(app); // [MỚI] Wrap express app

// Cấu hình Socket.io với CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL Frontend của bạn (Vite)
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/chat', chatRoutes); // [MỚI]

// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  // 1. Sự kiện tham gia phòng chat (Mỗi claim là 1 phòng)
  socket.on('join_chat', (claimId) => {
    socket.join(claimId);
    console.log(`User ${socket.id} joined room: ${claimId}`);
  });

  // 2. Sự kiện gửi tin nhắn
  socket.on('send_message', async (data) => {
    // data = { claimId, senderId, content }
    const { claimId, senderId, content } = data;

    try {
      // Lưu vào DB ngay lập tức để đảm bảo không mất tin
      const query = `
        INSERT INTO messages (claim_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const result = await pool.query(query, [claimId, senderId, content]);
      const savedMessage = result.rows[0];

      // Gửi tin nhắn lại cho TẤT CẢ người trong phòng (kể cả người gửi)
      // Frontend sẽ nhận sự kiện này để render tin mới
      io.to(claimId).emit('receive_message', savedMessage);
      
    } catch (err) {
      console.error("Socket Error:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
// -----------------------

const PORT = process.env.PORT || 5000;

// [QUAN TRỌNG] Đổi app.listen thành server.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io ready`);
});