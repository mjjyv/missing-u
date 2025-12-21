import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

export default function ItemDetailModal({ item, onClose, onUpdateList }) { // Thêm prop onUpdateList để refresh lại danh sách sau khi xóa/sửa
  const { user } = useAuth(); // Lấy thông tin người đang đăng nhập
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: item?.title, description: item?.description });

  if (!item) return null;

  // Kiểm tra xem người xem có phải là chủ bài đăng không
  // Lưu ý: user từ context có thể lưu id hoặc lấy từ token decode, hãy đảm bảo so sánh đúng
  // Giả sử user object có dạng { id: 1, email: '...' }

  // Log để kiểm tra giá trị thực tế
  console.log("Current User:", user); 
  console.log("Item Owner ID:", item.user_id);

  // So sánh id người dùng đăng nhập và id người tạo bài viết
  const isOwner = user && user.id === item.user_id;

  const handleDelete = async () => {
    if (!window.confirm("Bạn chắc chắn muốn xóa bài này? Hành động này không thể hoàn tác.")) return;
    try {
      await axiosClient.delete(`/items/${item.id}`);
      alert("Đã xóa thành công!");
      onClose();
      if (onUpdateList) onUpdateList(); // Refresh list bên ngoài
    } catch (err) {
      alert("Lỗi xóa bài: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdate = async () => {
    try {
      await axiosClient.put(`/items/${item.id}`, editForm);
      alert("Cập nhật thành công!");
      setIsEditing(false);
      // Cập nhật lại UI tạm thời (hoặc gọi onUpdateList)
      item.title = editForm.title;
      item.description = editForm.description;
      if (onUpdateList) onUpdateList();
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Header Ảnh */}
        <div className="relative h-64 bg-gray-200 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white font-bold">✕</button>
          <div className="flex overflow-x-auto h-full snap-x">
            {item.images?.length > 0 ? (
              item.images.map((img, i) => (
                <img key={i} src={img} className="h-full w-full object-contain bg-gray-900 snap-center shrink-0" alt="" />
              ))
            ) : <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>}
          </div>
        </div>

        {/* Nội dung (Scrollable) */}
        <div className="p-6 overflow-y-auto">
          {/* Header Info */}
          <div className="flex justify-between items-start mb-4">
            <div>
               {/* 1. HIỂN THỊ TÊN NGƯỜI ĐĂNG */}
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700">
                    {item.author_name ? item.author_name.charAt(0) : 'U'}
                  </div>
                  <span className="font-bold text-gray-700">{item.author_name || 'Người dùng ẩn danh'}</span>
               </div>
               <span className="text-xs text-gray-400">Đăng ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
              {item.type === 'LOST' ? 'TIN BÁO MẤT' : 'TIN NHẶT ĐƯỢC'}
            </span>
          </div>

          {/* 2. LOGIC SỬA BÀI */}
          {isEditing ? (
            <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg border">
              <input 
                className="w-full p-2 border rounded font-bold"
                value={editForm.title} 
                onChange={e => setEditForm({...editForm, title: e.target.value})} 
              />
              <textarea 
                className="w-full p-2 border rounded h-24"
                value={editForm.description} 
                onChange={e => setEditForm({...editForm, description: e.target.value})} 
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-gray-600">Hủy</button>
                <button onClick={handleUpdate} className="px-3 py-1 bg-gray-500 text-white rounded">Lưu</button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.title}</h2>
              {/* Hiển thị thuộc tính chi tiết */}
              <div className="flex flex-wrap gap-2 mb-4">
                 {Object.entries(item.attributes || {}).map(([key, value]) => (
                    <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded border">
                      <b>{key}:</b> {typeof value === 'object' ? JSON.stringify(value) : value}
                    </span>
                 ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-6">{item.description}</p>
            </>
          )}

          {/* 3. NÚT TÁC VỤ CHO CHỦ SỞ HỮU */}
          {isOwner && !isEditing && (
             <div className="flex gap-3 mb-6 pt-4 border-t">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-bold"
                >
                  ✏️ Sửa bài
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-bold"
                >
                  🗑️ Xóa bài
                </button>
             </div>
          )}

          {/* Nút Liên hệ (Cho người xem) */}
          {!isOwner && (
            <button className="w-full bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg transition">
               LIÊN HỆ NGAY
            </button>
          )}
        </div>
      </div>
    </div>
  );
}