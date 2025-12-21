// backend/controllers/chatController.js
const pool = require('../config/db');

// Lấy lịch sử chat của một Claim (Handshake)
exports.getChatHistory = async (req, res) => {
  try {
    const { claimId } = req.params;
    const userId = req.user.id;

    // 1. Kiểm tra BẢO MẬT: User này có quyền xem chat này không?
    // User phải là Claimer HOẶC Owner của Item liên quan
    const verifyQuery = `
      SELECT c.claimer_id, i.user_id as owner_id
      FROM claims c
      JOIN items i ON c.item_id = i.id
      WHERE c.id = $1
    `;
    const verifyRes = await pool.query(verifyQuery, [claimId]);

    if (verifyRes.rows.length === 0) {
      return res.status(404).json({ message: "Giao dịch không tồn tại" });
    }

    const { claimer_id, owner_id } = verifyRes.rows[0];

    if (userId !== claimer_id && userId !== owner_id) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập cuộc trò chuyện này." });
    }

    // 2. Lấy danh sách tin nhắn
    const messagesQuery = `
      SELECT m.*, u.full_name as sender_name, u.role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.claim_id = $1
      ORDER BY m.created_at ASC 
    `;
    // ASC: Tin cũ ở trên, tin mới ở dưới
    
    const messagesRes = await pool.query(messagesQuery, [claimId]);

    res.json({ status: 'success', data: messagesRes.rows });

  } catch (err) {
    console.error("Chat History Error:", err);
    res.status(500).json({ message: err.message });
  }
};