const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middlewares/authMiddleware');
const uploadCloud = require('../config/cloudinary');

// Middleware uploadCloud.array('images', 5) PHẢI nằm trước Controller [cite: 11]
router.post('/', protect, uploadCloud.array('images', 5), itemController.createItem);
router.get('/', itemController.getAllItems);
router.get('/categories', require('../controllers/categoryController').getCategories);

module.exports = router;