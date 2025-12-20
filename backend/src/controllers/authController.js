const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Đăng ký tài khoản mới
exports.register = async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
        const password_hash = await bcrypt.hash(password, 12);
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, password_hash, full_name]
        );
        res.status(201).json({ status: 'success', data: newUser.rows[0] });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: 'Email đã tồn tại!' });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0 || !(await bcrypt.compare(password, user.rows[0].password_hash))) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign(
            { id: user.rows[0].id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({ token, data: { email: user.rows[0].email, role: user.rows[0].role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};