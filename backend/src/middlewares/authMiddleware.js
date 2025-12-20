const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Bạn cần đăng nhập!' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin user vào request để dùng ở các bước sau
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};