import React from 'react';

export default function ItemDetailModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="relative h-64 bg-gray-200">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white shadow-lg">✕</button>
          
          {/* Gallery ảnh (Tối đa 5 ảnh) */}
          <div className="flex overflow-x-auto h-full snap-x">
            {item.images && item.images.length > 0 ? (
              item.images.map((img, i) => (
                <img key={i} src={img} className="h-full w-full object-contain bg-gray-900 snap-center shrink-0" alt="" />
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 italic">Không có hình ảnh</div>
            )}
          </div>
        </div>

        {/* Nội dung chi tiết */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
              {item.type === 'LOST' ? 'TIN BÁO MẤT' : 'TIN NHẶT ĐƯỢC'}
            </span>
            <span className="text-gray-400 text-sm italic">Ngày đăng: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">{item.title}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(item.attributes || {}).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold">{key}</p>
                <p className="text-sm font-semibold text-gray-700">{typeof value === 'object' ? JSON.stringify(value) : value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Mô tả chi tiết</h4>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{item.description}</p>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg transition">
              {item.type === 'LOST' ? 'TÔI ĐANG GIỮ NÓ' : 'ĐÂY LÀ ĐỒ CỦA TÔI (CLAIM)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}