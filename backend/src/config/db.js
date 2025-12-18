const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// const pool = new Pool({
//   user: 'admin',
//   host: 'localhost',
//   database: 'missingu_db',
//   password: 'password123', // Thử viết cứng vào đây để test trước
//   port: 5433,
// });

module.exports = pool;