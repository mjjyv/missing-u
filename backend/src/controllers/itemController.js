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
            RETURNING id, type, category_id, title, description, attributes, location, created_at;
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
exports.getAllItems = async (req, res) => {
    try {
        // JOIN bảng users để lấy tên người đăng bài
        const query = `
    SELECT i.id, i.user_id, i.title, i.description, i.type, i.images, i.attributes, i.created_at, i.status, 
    ST_AsGeoJSON(i.location)::json as location,
    u.full_name as author_name
    FROM items i
    JOIN users u ON i.user_id = u.id
    WHERE i.status != 'CLOSED'
    ORDER BY i.created_at DESC;
`;
        const result = await pool.query(query);

        // Chuyển đổi location sang GeoJSON để Frontend Leaflet hiển thị [cite: 49]
        const formattedData = result.rows.map(item => ({
            ...item,
            location: typeof item.location === 'string' ? JSON.parse(item.location) : item.location
        }));

        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. LẤY BÀI ĐĂNG THEO KHUNG NHÌN BẢN ĐỒ (SPATIAL SEARCH)
exports.getItemsInBounds = async (req, res) => {
    try {
        const { minLat, maxLat, minLng, maxLng, type, category_id } = req.query;

        if (!minLat || !maxLat || !minLng || !maxLng) {
            return res.status(400).json({ message: "Thiếu tọa độ khung nhìn" });
        }

        // Truy vấn lọc theo vùng nhìn (Bound Search) và JOIN lấy tên tác giả [cite: 39, 44]
        let query = `
            SELECT i.id, i.user_id, i.title, i.description, i.type, i.images, i.attributes, i.created_at, i.status, 
    ST_AsGeoJSON(i.location)::json as location,
    u.full_name as author_name
            FROM items i
            JOIN users u ON i.user_id = u.id
            WHERE i.location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
            AND i.status != 'CLOSED'
        `;

        const values = [
            parseFloat(minLng), parseFloat(minLat), 
            parseFloat(maxLng), parseFloat(maxLat)
        ];

        if (type) {
            query += ` AND i.type = $${values.length + 1}`;
            values.push(type);
        }

        if (category_id) {
            query += ` AND i.category_id = $${values.length + 1}`;
            values.push(parseInt(category_id));
        }

        const result = await pool.query(query, values);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 4. XÓA BÀI ĐĂNG (DELETE)
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        // Kiểm tra quyền sở hữu bài viết trước khi xóa
        const query = 'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING id';
        const result = await pool.query(query, [id, req.user.id]);

        if (result.rowCount === 0) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bài này hoặc bài không tồn tại." });
        }

        res.json({ status: 'success', message: 'Đã xóa bài đăng.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 5. CẬP NHẬT BÀI ĐĂNG (UPDATE)
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status } = req.body;

        const query = `
            UPDATE items 
            SET title = COALESCE($1, title), 
                description = COALESCE($2, description),
                status = COALESCE($3, status)
            WHERE id = $4 AND user_id = $5
            RETURNING *
        `;
        const values = [title, description, status, id, req.user.id];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(403).json({ message: "Không thể cập nhật bài đăng này." });
        }

        res.json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};