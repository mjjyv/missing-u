// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

// Lấy lịch sử chat (Yêu cầu đăng nhập)
router.get('/:claimId', protect, chatController.getChatHistory);

module.exports = router;