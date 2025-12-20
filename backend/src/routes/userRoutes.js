const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Tất cả các route trong này đều cần đăng nhập
router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/update-profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

module.exports = router;