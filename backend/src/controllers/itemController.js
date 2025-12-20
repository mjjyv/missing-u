const pool = require('../config/db');

exports.createItem = async (req, res) => {
    try {
        // Log để kiểm tra Multer có nhận được file từ Cloudinary không
        console.log("Files received from Multer:", req.files);

        // Lấy danh sách URL từ Cloudinary. Multer-storage-cloudinary trả về field 'path'
        const imageUrls = req.files ? req.files.map(file => file.path) : [];

        if (imageUrls.length === 0) {
            return res.status(400).json({ message: "Không nhận được hình ảnh. Vui lòng thử lại." });
        }

        const { type, category_id, title, description, latitude, longitude } = req.body;
        const attributes = JSON.parse(req.body.attributes || '{}');

        const query = `
            INSERT INTO items 
            (user_id, type, category_id, title, description, attributes, images, location)
            VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))
            RETURNING id, images;
        `;
        
        // Cần đảm bảo thứ tự tham số: $7 là mảng imageUrls
        const values = [
            req.user.id, type, category_id, title, description, 
            attributes, imageUrls, longitude, latitude
        ];
        
        const result = await pool.query(query, values);
        res.status(201).json({ status: 'success', data: result.rows[0] });

    } catch (err) {
        console.error("Lỗi Server:", err);
        res.status(500).json({ message: err.message });
    }
};


exports.getAllItems = async (req, res) => {
    try {
        // Sử dụng ST_AsGeoJSON để chuyển dữ liệu tọa độ PostGIS sang định dạng JSON mà Leaflet đọc được 
        const query = `
            SELECT id, user_id, title, description, type, images, attributes, created_at, status, 
            ST_AsGeoJSON(location)::json as location 
            FROM items 
            WHERE status = 'PENDING' 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};