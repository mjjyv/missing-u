const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { protect } = require('../middlewares/authMiddleware');
const uploadCloud = require('../config/cloudinary');

// Gửi yêu cầu (Kèm 1 ảnh bằng chứng)
router.post('/:itemId', protect, uploadCloud.array('proof', 1), claimController.createClaim);

// Owner xem danh sách yêu cầu của món đồ
router.get('/item/:itemId', protect, claimController.getClaimsByItem);

// Owner duyệt yêu cầu
router.put('/:claimId/status', protect, claimController.updateClaimStatus);

module.exports = router;