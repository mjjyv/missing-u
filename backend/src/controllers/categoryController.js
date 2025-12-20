const pool = require('../config/db');

exports.getCategories = async (req, res) => {
    try {
        // Lấy toàn bộ danh mục
        const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};