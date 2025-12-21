const pool = require('../config/db');

/**
 * Matching Engine: Tính toán điểm số dựa trên trọng số
 * 1. Danh mục (Bộ lọc cứng): Nếu không trùng -> 0đ [cite: 59, 60]
 * 2. Khoảng cách (40đ): <500m: 40đ | 500m-2km: 20đ | >5km: 0đ [cite: 61, 62]
 * 3. Thuộc tính (40đ): Trùng Màu sắc: 20đ | Trùng Nhãn hiệu: 20đ 
 * 4. Từ khóa (20đ): So khớp văn bản Tiêu đề/Mô tả [cite: 65, 66]
 */
exports.findMatches = async (newItem) => {
    const { id, type, category_id, attributes, description, location, title } = newItem;
    
    // Tìm loại tin đối lập: LOST <-> FOUND [cite: 53]
    const targetType = type === 'LOST' ? 'FOUND' : 'LOST';
    
    // Chuẩn bị dữ liệu thuộc tính để so sánh [cite: 54]
    const color = attributes?.color || '';
    const brand = attributes?.brand || '';
    const searchText = `${title} ${description}`;

    const query = `
        SELECT 
            id, user_id, title, type, images, attributes, created_at,
            ST_AsGeoJSON(location)::json as location_json,
            (
                -- TIÊU CHÍ 2: KHOẢNG CÁCH (Max 40đ) [cite: 61, 62]
                CASE 
                    WHEN ST_Distance(location, $1::geography) < 500 THEN 40
                    WHEN ST_Distance(location, $1::geography) < 2000 THEN 20
                    ELSE 0 
                END
                +
                -- TIÊU CHÍ 3: THUỘC TÍNH CHI TIẾT (Max 40đ) 
                CASE 
                    WHEN attributes->>'color' IS NOT NULL AND attributes->>'color' != '' AND attributes->>'color' = $2 THEN 20 
                    ELSE 0 
                END
                +
                CASE 
                    WHEN attributes->>'brand' IS NOT NULL AND attributes->>'brand' != '' AND attributes->>'brand' = $3 THEN 20 
                    ELSE 0 
                END
                +
                -- TIÊU CHÍ 4: SO KHỚP TỪ KHÓA (Max 20đ) [cite: 65, 66]
                CASE 
                    WHEN to_tsvector('simple', title || ' ' || description) @@ plainto_tsquery('simple', $4) THEN 20 
                    ELSE 0 
                END
            ) as total_score
        FROM items
        WHERE 
            type = $5                       -- Phải là loại đối lập [cite: 53]
            AND category_id = $6            -- TIÊU CHÍ 1: Phải cùng danh mục [cite: 59, 60]
            AND status = 'PENDING'          -- Tin chưa đóng
            AND id != $7                    -- Không so khớp chính nó
            AND ST_DWithin(location, $1::geography, 10000) -- Chỉ tìm trong bán kính 10km để tối ưu
        ORDER BY total_score DESC;
    `;

    try {
        const values = [location, color, brand, searchText, targetType, category_id, id];
        const result = await pool.query(query, values);
        
        // Trả về danh sách đạt ngưỡng điểm (ví dụ >= 60đ để thông báo) [cite: 58]
        return result.rows.filter(match => parseFloat(match.total_score) >= 60);
    } catch (err) {
        console.error('Matching Engine SQL Error:', err.message);
        return [];
    }
};