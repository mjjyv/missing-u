const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// API Kiểm tra kết nối
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT postgis_version()');
    res.json({
      status: 'Online',
      message: 'Backend & Database connected!',
      postgis: dbRes.rows[0].postgis_version
    });
  } catch (err) {
    res.status(500).json({ status: 'Error', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));