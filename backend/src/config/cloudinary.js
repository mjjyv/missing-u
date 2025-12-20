const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'missingu_items',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // Transformation giúp nén ảnh để tiết kiệm dung lượng Cloudinary
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const uploadCloud = multer({ storage });
module.exports = uploadCloud;