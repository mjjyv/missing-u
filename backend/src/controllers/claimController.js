const pool = require('../config/db');

// 1. Gửi yêu cầu nhận đồ (POST)
exports.createClaim = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { proof_description } = req.body;
    const claimerId = req.user.id;
    
    // Lấy URL ảnh từ Cloudinary (nếu có upload)
    const proofImage = req.files && req.files.length > 0 ? req.files[0].path : null;

    // Kiểm tra: Không được claim đồ của chính mình
    const itemCheck = await pool.query('SELECT user_id FROM items WHERE id = $1', [itemId]);
    if (itemCheck.rows.length === 0) return res.status(404).json({ message: "Tin không tồn tại" });
    if (itemCheck.rows[0].user_id === claimerId) {
      return res.status(400).json({ message: "Bạn không thể tự nhận đồ của mình đăng!" });
    }

    // Insert vào DB
    const query = `
      INSERT INTO claims (item_id, claimer_id, proof_image, proof_description)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [itemId, claimerId, proofImage, proof_description]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Lỗi trùng lặp UNIQUE
      return res.status(400).json({ message: "Bạn đã gửi yêu cầu cho món đồ này rồi." });
    }
    res.status(500).json({ message: err.message });
  }
};

// 2. Lấy danh sách yêu cầu cho 1 món đồ (GET) - CHỈ DÀNH CHO OWNER
exports.getClaimsByItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Kiểm tra quyền sở hữu: Join bảng items để xem user_id của item có khớp với user đang request không
    const verifyQuery = `SELECT user_id FROM items WHERE id = $1`;
    const verifyRes = await pool.query(verifyQuery, [itemId]);
    
    if (verifyRes.rows.length === 0) return res.status(404).json({ message: "Item not found" });
    if (verifyRes.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xem yêu cầu của bài này." });
    }

    // Lấy danh sách claims kèm thông tin người gửi (để hiện tên/avatar)
    const query = `
      SELECT c.*, u.full_name, u.email 
      FROM claims c
      JOIN users u ON c.claimer_id = u.id
      WHERE c.item_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [itemId]);

    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Duyệt yêu cầu (PUT) - ACCEPT/REJECT
exports.updateClaimStatus = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status } = req.body; // 'ACCEPTED' hoặc 'REJECTED'
    const userId = req.user.id;

    // Validation Status
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    // Kiểm tra quyền Owner (Phức tạp hơn: Phải join từ claims -> items để check owner)
    const checkOwner = `
      SELECT i.user_id 
      FROM claims c 
      JOIN items i ON c.item_id = i.id 
      WHERE c.id = $1
    `;
    const checkRes = await pool.query(checkOwner, [claimId]);
    
    if (checkRes.rows.length === 0) return res.status(404).json({ message: "Claim not found" });
    if (checkRes.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Không có quyền duyệt." });
    }

    // Update Status
    const updateQuery = `UPDATE claims SET status = $1 WHERE id = $2 RETURNING *`;
    const result = await pool.query(updateQuery, [status, claimId]);
    
    // TODO: Nếu ACCEPTED -> Trigger mở chat hoặc gửi noti (Làm ở giai đoạn sau)

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};