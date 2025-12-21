const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middlewares/authMiddleware');
const uploadCloud = require('../config/cloudinary');
const upload = require('../middlewares/uploadMiddleware'); // Giả sử đã có file này, hoặc định nghĩa multer ở đây


// Middleware uploadCloud.array('images', 5) PHẢI nằm trước Controller [cite: 11]
router.post('/', protect, uploadCloud.array('images', 5), itemController.createItem);
router.get('/', itemController.getAllItems);
router.get('/categories', require('../controllers/categoryController').getCategories);
router.get('/spatial', itemController.getItemsInBounds);


// Route mới: Lấy bài đăng của tôi
router.get('/my-posts', protect, itemController.getMyPosts);

// Route cập nhật: PUT và DELETE (đã có, nhưng đảm bảo protect)
router.put('/:id', protect, uploadCloud.array('images', 5), itemController.updateItem);
router.delete('/:id', protect, itemController.deleteItem);


router.get('/:id', protect, itemController.getItemById);
module.exports = router;