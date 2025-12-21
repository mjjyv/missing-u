const pool = require('../config/db');
const matchingEngine = require('../services/MatchingEngine');

// 1. TẠO BÀI ĐĂNG MỚI (CREATE)
exports.createItem = async (req, res) => {
    try {
        // Thu thập URL ảnh từ Multer (Cloudinary) [cite: 11]
        const imageUrls = req.files ? req.files.map(file => file.path) : [];

        // Trích xuất dữ liệu từ body
        const { type, category_id, title, description, latitude, longitude } = req.body;
        
        // Chuyển đổi attributes từ string về JSONB [cite: 52, 53]
        let attributes = {};
        if (req.body.attributes) {
            attributes = typeof req.body.attributes === 'string' 
                ? JSON.parse(req.body.attributes) 
                : req.body.attributes;
        }

        const catId = parseInt(category_id);
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // Kiểm tra dữ liệu bắt buộc [cite: 53, 54, 55]
        if (!type || !catId || !title || isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc hoặc tọa độ không hợp lệ" });
        }

        // Lưu vào DB với PostGIS (ST_MakePoint nhận Longitude trước, Latitude sau)
        const insertQuery = `
            INSERT INTO items 
            (user_id, type, category_id, title, description, attributes, images, location)
            VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))
            RETURNING id, user_id, type, category_id, title, description, attributes, location, created_at;
        `;

        const values = [req.user.id, type, catId, title, description, attributes, imageUrls, lng, lat];
        const result = await pool.query(insertQuery, values);
        const newItem = result.rows[0];

        // GỌI MATCHING ENGINE: Tính toán trọng số so khớp [cite: 26, 57]
        const matches = await matchingEngine.findMatches(newItem);

        // Phản hồi kèm danh sách tin trùng khớp tiềm năng 
        res.status(201).json({ 
            status: 'success', 
            data: newItem,
            matches: matches // Trả về các tin có độ khớp cao [cite: 58]
        });

    } catch (err) {
        console.error("Lỗi createItem:", err);
        res.status(500).json({ message: "Lỗi hệ thống: " + err.message });
    }
};

// 2. LẤY TẤT CẢ BÀI ĐĂNG (READ - ALL)
// 1. Cập nhật hàm getAllItems (Dùng cho HybridView/Explore)
exports.getAllItems = async (req, res) => {
    try {
        const query = `
            SELECT i.id, i.user_id, i.title, i.description, i.type, i.images, i.attributes, i.created_at, i.status, 
            ST_AsGeoJSON(i.location)::json as location 
            FROM items i
            WHERE i.status != 'CLOSED' 
            ORDER BY i.created_at DESC;
        `;
        // Lưu ý: Đã thêm i.user_id vào ngay sau i.id
        const result = await pool.query(query);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. LẤY BÀI ĐĂNG THEO KHUNG NHÌN BẢN ĐỒ (SPATIAL SEARCH)
// backend/controllers/itemController.js

exports.getItemsInBounds = async (req, res) => {
    try {
        const { 
            minLat, maxLat, minLng, maxLng, // Spatial (Bounds)
            type, category_id,              // Basic
            fromDate, toDate,               // Temporal
            color, brand, material,         // Attributes
            status                          // Status
        } = req.query;

        // 1. Query cơ bản: Lọc theo khung nhìn bản đồ (Spatial)
        // Nếu không có bounds (lần đầu load), có thể bỏ qua điều kiện này hoặc set mặc định
        let query = `
            SELECT i.id, i.user_id, i.title, i.type, i.images, i.attributes, i.created_at, i.status,
            ST_AsGeoJSON(i.location)::json as location,
            u.full_name as author_name
            FROM items i
            JOIN users u ON i.user_id = u.id
            WHERE 1=1 
        `;
        
        const values = [];

        // --- A. Lọc Không gian (Spatial - Viewport) ---
        if (minLat && maxLat && minLng && maxLng) {
            values.push(parseFloat(minLng), parseFloat(minLat), parseFloat(maxLng), parseFloat(maxLat));
            query += ` AND i.location && ST_MakeEnvelope($1, $2, $3, $4, 4326)`;
        }

        // --- B. Lọc Loại tin & Danh mục ---
        if (type) {
            values.push(type);
            query += ` AND i.type = $${values.length}`;
        }
        if (category_id) {
            values.push(parseInt(category_id));
            query += ` AND i.category_id = $${values.length}`;
        }

        // --- C. Lọc Thời gian (Temporal) ---
        if (fromDate) {
            values.push(fromDate); // Format: YYYY-MM-DD
            query += ` AND i.created_at >= $${values.length}::date`;
        }
        if (toDate) {
            values.push(toDate);
            query += ` AND i.created_at <= ($${values.length}::date + INTERVAL '1 day')`; // Hết ngày đó
        }

        // --- D. Lọc Thuộc tính (Attributes - JSONB) ---
        // Màu sắc
        if (color) {
            values.push(color);
            query += ` AND i.attributes->>'color' = $${values.length}`;
        }
        // Nhãn hiệu
        if (brand) {
            values.push(brand);
            // Dùng ILIKE để tìm kiếm không phân biệt hoa thường
            query += ` AND i.attributes->>'brand' ILIKE $${values.length}`; 
        }
        // Chất liệu
        if (material) {
            values.push(material);
            query += ` AND i.attributes->>'material' ILIKE $${values.length}`;
        }

        // --- E. Lọc Tình trạng (Status) ---
        if (status) {
            values.push(status);
            query += ` AND i.status = $${values.length}`;
        } else {
            // Mặc định không hiện tin đã đóng/xóa
            query += ` AND i.status != 'CLOSED'`;
        }

        // Sắp xếp mới nhất trước
        query += ` ORDER BY i.created_at DESC LIMIT 100`;

        const result = await pool.query(query, values);
        res.json({ status: 'success', data: result.rows });

    } catch (err) {
        console.error("Filter Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// API Mới: Lấy danh sách bài đăng của user hiện tại
exports.getMyPosts = async (req, res) => {
    try {
        const userId = req.user.id; // Từ middleware protect
        const query = `
            SELECT i.*, u.full_name as author_name
            FROM items i
            JOIN users u ON i.user_id = u.id
            WHERE i.user_id = $1 AND i.status != 'CLOSED'
            ORDER BY i.created_at DESC;
        `;
        const result = await pool.query(query, [userId]);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cập nhật bài đăng (Mở rộng để hỗ trợ status)
// backend/controllers/itemController.js

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { 
      title, description, attributes: attributesStr, status, type, // <-- QUAN TRỌNG
      category_id, latitude, longitude, existing_images: existingStr 
    } = req.body;

    // 1. Xử lý Attributes
    let parsedAttributes = null;
    if (attributesStr) {
      parsedAttributes = typeof attributesStr === 'string' ? JSON.parse(attributesStr) : attributesStr;
    }

    // 2. Xử lý Tọa độ (Ép kiểu)
    const catId = category_id ? parseInt(category_id) : null;
    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;

    // 3. Xử lý Hình ảnh (QUAN TRỌNG: Tránh xóa ảnh khi sửa nhanh)
    let finalImages = null; // Mặc định null để COALESCE trong SQL giữ lại giá trị cũ

    // Chỉ xử lý ảnh nếu có file mới upload HOẶC có gửi danh sách ảnh cũ
    // (ItemDetailModal không gửi existing_images, nên finalImages sẽ là null -> OK)
    if (req.files?.length > 0 || existingStr !== undefined) {
         const existingArr = existingStr ? (typeof existingStr === 'string' ? JSON.parse(existingStr) : existingStr) : [];
         const newImageUrls = req.files ? req.files.map(file => file.path) : [];
         finalImages = [...existingArr, ...newImageUrls];
    }

    // 4. Câu lệnh SQL
    // SỬA LỖI $7: Thêm ::double precision vào sau tham số trong CASE WHEN
    const query = `
      UPDATE items 
      SET 
        title = COALESCE($1, title), 
        description = COALESCE($2, description),
        attributes = COALESCE($3, attributes),
        status = COALESCE($4, status),
        images = COALESCE($5, images),
        category_id = COALESCE($6, category_id),
        location = CASE 
          -- FIX LỖI TẠI ĐÂY: Ép kiểu dữ liệu cho tham số kiểm tra null
          WHEN $7::double precision IS NOT NULL AND $8::double precision IS NOT NULL 
          THEN ST_SetSRID(ST_MakePoint($8::double precision, $7::double precision), 4326)
          ELSE location 
        END,
        type = COALESCE($11, type)
      WHERE id = $9 AND user_id = $10
      RETURNING *;
    `;

    const values = [
      title,            // $1
      description,      // $2
      parsedAttributes, // $3
      status,           // $4
      finalImages,      // $5 (Nếu null, DB sẽ giữ nguyên ảnh cũ)
      catId,            // $6
      lat,              // $7
      lng,              // $8
      id,               // $9
      req.user.id,       // $10
      type
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật bài này hoặc bài không tồn tại." });
    }

    const updatedItem = result.rows[0];

    // Trigger matching nếu có thay đổi quan trọng
    if ((parsedAttributes || status === 'PENDING' || (lat !== null && lng !== null)) && status !== 'CLOSED') {
      matchingEngine.findMatches(updatedItem).catch(err => 
        console.error("Lỗi Matching sau update:", err)
      );
    }

    res.json({ status: 'success', data: updatedItem });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Xóa bài đăng (Soft-delete bằng status = 'CLOSED')
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            UPDATE items 
            SET status = 'CLOSED'
            WHERE id = $1 AND user_id = $2
            RETURNING id;
        `;
        const result = await pool.query(query, [id, req.user.id]);

        if (result.rowCount === 0) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bài này hoặc bài không tồn tại." });
        }

        res.json({ status: 'success', message: 'Bài đăng đã được đóng (xóa mềm).' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get item by ID for editing
exports.getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT i.*, u.full_name as author_name,
            ST_AsGeoJSON(i.location)::json as location
            FROM items i
            JOIN users u ON i.user_id = u.id
            WHERE i.id = $1 AND i.status != 'CLOSED';
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Bài đăng không tồn tại hoặc đã bị đóng." });
        }
        res.json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// backend/controllers/itemController.js



// ... (các hàm cũ createItem, getAllItems...)

// [MỚI] Hàm lấy danh sách tin trùng khớp cho một Item ID cụ thể
exports.getItemMatches = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Lấy thông tin chi tiết của tin gốc từ DB
    const itemQuery = `
      SELECT * FROM items WHERE id = $1 AND status != 'CLOSED'
    `;
    const itemResult = await pool.query(itemQuery, [id]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng hoặc bài đã đóng." });
    }

    const targetItem = itemResult.rows[0];

    // 2. Gọi Matching Engine để tìm các tin khớp với tin gốc này
    // Lưu ý: findMatches thường trả về danh sách kèm điểm số (score)
    const matches = await matchingEngine.findMatches(targetItem);

    // 3. Trả về kết quả
    res.json({ 
      status: 'success', 
      data: matches 
    });

  } catch (err) {
    console.error("Get Matches Error:", err);
    res.status(500).json({ message: err.message });
  }
};