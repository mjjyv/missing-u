import React from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

export default function ItemDetailModal({ item, onClose, onUpdateList }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!item) return null;

  // ⚠️ Ép kiểu an toàn khi so sánh ID
  const isOwner = user && Number(user.id) === Number(item.user_id);

  const handleDelete = async () => {
    if (!window.confirm("Bạn chắc chắn muốn xóa bài này? Hành động này không thể hoàn tác.")) return;

    try {
      await axiosClient.delete(`/items/${item.id}`);
      alert("Đã xóa bài đăng thành công!");
      onClose();
      if (onUpdateList) onUpdateList();
    } catch (err) {
      alert("Lỗi khi xóa bài: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEditRedirect = (e) => {
    e?.stopPropagation(); // Ngăn lan sự kiện nếu cần
    onClose();
    navigate(`/edit-item/${item.id}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]"
           onClick={(e) => e.stopPropagation()}>
        
        {/* Header Ảnh */}
        <div className="relative h-64 bg-gray-200 shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white font-bold text-xl"
          >
            ✕
          </button>
          <div className="flex overflow-x-auto h-full snap-x scrollbar-hide">
            {item.images?.length > 0 ? (
              item.images.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  className="h-full w-full object-contain bg-gray-900 snap-center shrink-0" 
                  alt={`Hình ${i + 1}`} 
                />
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Không có hình ảnh
              </div>
            )}
          </div>
        </div>

        {/* Nội dung */}
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700">
                  {item.author_name ? item.author_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="font-bold text-gray-700">
                  {item.author_name || 'Người dùng ẩn danh'}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                Đăng ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
              item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'
            }`}>
              {item.type === 'LOST' ? 'TIN BÁO MẤT' : 'TIN NHẶT ĐƯỢC'}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">{item.title}</h2>

          {item.attributes && Object.keys(item.attributes).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(item.attributes).map(([key, value]) => (
                <span key={key} className="text-xs bg-gray-100 px-3 py-1 rounded-full border">
                  <b className="capitalize">{key}:</b> {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              ))}
            </div>
          )}

          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-6">
            {item.description}
          </p>

          <div className="mt-6 pt-4 border-t">
            {isOwner ? (
              <div className="flex gap-3">
                <button
                  onClick={handleEditRedirect}
                  className="flex-1 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 font-bold shadow-lg transition"
                >
                  ✏️ Sửa bài (Trang đầy đủ)
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 font-bold shadow-lg transition"
                >
                  🗑️ Xóa bài
                </button>
              </div>
            ) : (
              <button className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg transition">
                📞 LIÊN HỆ NGAY
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}