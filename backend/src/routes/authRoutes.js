const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Công khai
router.post('/register', authController.register);
router.post('/login', authController.login);

// Cần đăng nhập (Để Frontend kiểm tra token còn hạn không)
router.get('/me', protect, (req, res) => {
    res.json({ status: 'success', user: req.user });
});

module.exports = router;