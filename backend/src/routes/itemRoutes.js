const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middlewares/authMiddleware');
const uploadCloud = require('../config/cloudinary');

// Middleware uploadCloud.array('images', 5) PHẢI nằm trước Controller [cite: 11]
router.post('/', protect, uploadCloud.array('images', 5), itemController.createItem);
router.get('/', itemController.getAllItems);
router.get('/categories', require('../controllers/categoryController').getCategories);
router.get('/spatial', itemController.getItemsInBounds);

// Thêm 2 dòng này
router.delete('/:id', protect, itemController.deleteItem);
router.put('/:id', protect, itemController.updateItem);

module.exports = router;