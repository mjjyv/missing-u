import React from 'react';

const COLORS = ['#000000', '#FFFFFF', '#808080', '#FF0000', '#0000FF', '#008000', '#FFFF00', '#A52A2A', '#FFC0CB', '#800080'];

export default function FilterSidebar({ filters, setFilters, onApply }) {
  
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Helper cho mốc thời gian nhanh
  const setQuickTime = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    handleChange('fromDate', start.toISOString().split('T')[0]);
    handleChange('toDate', end.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full overflow-y-auto">
      <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
        ⚡ Bộ lọc tìm kiếm
      </h3>

      {/* 1. KHÔNG GIAN (Đơn giản hóa: Bán kính tính từ Map Center được xử lý ở HybridView) */}
      {/* Ở đây ta chỉ lọc loại tin */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Loại tin</label>
        <select 
          className="w-full p-2 border rounded-lg bg-gray-50"
          value={filters.type}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="LOST">🔴 Tin Báo Mất</option>
          <option value="FOUND">🟢 Tin Nhặt Được</option>
        </select>
      </div>

      {/* 2. THỜI GIAN */}
      <div className="mb-6 border-t pt-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">Thời gian</label>
        <div className="flex gap-2 mb-2">
          <button onClick={() => setQuickTime(1)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">24h</button>
          <button onClick={() => setQuickTime(7)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">7 ngày</button>
          <button onClick={() => setQuickTime(30)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">1 tháng</button>
        </div>
        <div className="flex gap-2 items-center">
          <input 
            type="date" 
            className="w-full p-1 text-xs border rounded"
            value={filters.fromDate || ''}
            onChange={(e) => handleChange('fromDate', e.target.value)}
          />
          <span>-</span>
          <input 
            type="date" 
            className="w-full p-1 text-xs border rounded"
            value={filters.toDate || ''}
            onChange={(e) => handleChange('toDate', e.target.value)}
          />
        </div>
      </div>

      {/* 3. ĐẶC ĐIỂM (Màu sắc, Hãng) */}
      <div className="mb-6 border-t pt-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">Đặc điểm</label>
        
        {/* Màu sắc */}
        <p className="text-xs text-gray-500 mb-1">Màu sắc chủ đạo</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => handleChange('color', filters.color === c ? '' : c)}
              className={`w-6 h-6 rounded-full border-2 ${filters.color === c ? 'border-gray-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* Nhãn hiệu */}
        <input 
          type="text" 
          placeholder="Nhãn hiệu (VD: Gucci...)"
          className="w-full p-2 border rounded-lg text-sm mb-2"
          value={filters.brand || ''}
          onChange={(e) => handleChange('brand', e.target.value)}
        />
      </div>

      {/* 4. TÌNH TRẠNG */}
      <div className="mb-6 border-t pt-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái</label>
        <select 
          className="w-full p-2 border rounded-lg bg-gray-50 text-sm"
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="">Tất cả (Trừ đã xóa)</option>
          <option value="PENDING">⏳ Đang tìm / Đang giữ (Pending)</option>
          <option value="RESOLVED">✅ Đã xong (Resolved)</option>
        </select>
      </div>

      <button 
        onClick={onApply}
        className="w-full py-2 bg-gray-500 text-white rounded-lg font-bold shadow hover:bg-red-600 transition"
      >
        Áp dụng bộ lọc
      </button>
      
      <button 
        onClick={() => setFilters({ type: '', category_id: '' })} // Reset
        className="w-full mt-2 py-2 text-gray-500 text-sm hover:underline"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}