const pool = require('../config/db');

/**
 * Tìm kiếm các tin đăng phù hợp dựa trên thuật toán trọng số
 * @param {Object} newItem - Đối tượng tin đăng vừa mới tạo
 * @returns {Array} Danh sách các mục khớp có điểm > 80
 */
exports.findMatches = async (newItem) => {
    const { 
        id, type, category_id, attributes, 
        description, location 
    } = newItem;

    // 1. Xác định loại tin đối lập cần tìm (Mất <-> Nhặt được)
    const targetType = type === 'LOST' ? 'FOUND' : 'LOST';

    // 2. Lấy các thuộc tính để so sánh
    const color = attributes.color || '';
    const brand = attributes.brand || '';

    // 3. Câu lệnh SQL tính điểm trọng số (Weighted Scoring SQL)
    const query = `
        SELECT 
            id, user_id, title, type, images, created_at,
            ST_AsGeoJSON(location) as location_json,
            (
                -- TIÊU CHÍ 2: KHOẢNG CÁCH (Max 40đ)
                CASE 
                    WHEN ST_Distance(location, $1::geography) < 500 THEN 40
                    WHEN ST_Distance(location, $1::geography) < 2000 THEN 20
                    ELSE 0 
                END
                +
                -- TIÊU CHÍ 3: THUỘC TÍNH (Max 40đ)
                CASE WHEN attributes->>'color' = $2 THEN 20 ELSE 0 END
                +
                CASE WHEN attributes->>'brand' = $3 THEN 20 ELSE 0 END
                +
                -- TIÊU CHÍ 4: TỪ KHÓA (Max 20đ) - Tìm từ chung trong mô tả
                CASE 
                    WHEN to_tsvector('simple', description) @@ plainto_tsquery('simple', $4) THEN 20 
                    ELSE 0 
                END
            ) as total_score
        FROM items
        WHERE 
            type = $5 -- Chỉ tìm loại đối lập
            AND category_id = $6 -- TIÊU CHÍ 1: Lọc cứng theo Danh mục
            AND status = 'PENDING' -- Chỉ tìm tin đang hoạt động
            AND id != $7 -- Tránh tự so sánh chính mình (nếu cần)
            AND ST_DWithin(location, $1::geography, 5000) -- Tối ưu: Chỉ quét bán kính 5km
        ORDER BY total_score DESC
    `;

    try {
        const values = [
            location,   // $1: Tọa độ item mới (đã ở dạng binary geometry từ DB hoặc string hex)
            color,      // $2: Màu sắc
            brand,      // $3: Nhãn hiệu
            description,// $4: Mô tả để tìm từ khóa
            targetType, // $5: Loại tin cần tìm
            category_id,// $6: ID Danh mục
            id          // $7: ID của item mới
        ];

        const result = await pool.query(query, values);

        // 4. Lọc các kết quả đạt ngưỡng điểm (Threshold > 80)
        // Lưu ý: Logic "Notify" sẽ được thực hiện ở Controller hoặc NotificationService
        return result.rows.filter(match => match.total_score >= 60); // Tạm để 60 để dễ test, thực tế set 80
    } catch (err) {
        console.error('Matching Engine Error:', err);
        return [];
    }
};