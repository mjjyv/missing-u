const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Lấy thông tin chi tiết người dùng
exports.getProfile = async (req, res) => {
    try {
        const user = await pool.query(
            'SELECT id, email, full_name, role, trust_score, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json({ status: 'success', data: user.rows[0] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cập nhật thông tin cơ bản
exports.updateProfile = async (req, res) => {
    const { full_name } = req.body;
    try {
        const updatedUser = await pool.query(
            'UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name',
            [full_name, req.user.id]
        );
        res.json({ status: 'success', data: updatedUser.rows[0] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        // 1. Lấy user hiện tại
        const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        
        // 2. Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.rows[0].password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });

        // 3. Hash mật khẩu mới và lưu
        const salt = await bcrypt.genSalt(12);
        const newHash = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

        res.json({ status: 'success', message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};