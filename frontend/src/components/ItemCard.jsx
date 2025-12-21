import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ItemCard({ 
  item, 
  onClick,          // Hàm mở modal chi tiết
  isHovered,        
  onHover           
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dateStr = new Date(item.created_at).toLocaleDateString('vi-VN');

  // ⚠️ Ép kiểu an toàn để tránh lỗi string vs number
  const isOwner = user && Number(user.id) === Number(item.user_id);

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/edit-item/${item.id}`);
  };

  const isCurrentlyHovered = isHovered === item.id;

  return (
    <div
      id={`item-${item.id}`}
      className={`
        relative flex p-4 mb-4 bg-white rounded-xl shadow-sm cursor-pointer 
        transition-all duration-300 border-l-4
        ${item.type === 'LOST' ? 'border-red-500' : 'border-green-500'}
        ${isCurrentlyHovered 
          ? 'bg-blue-50 ring-2 ring-blue-300 shadow-lg scale-[1.02]' 
          : 'hover:shadow-md hover:scale-[1.01]'
        }
      `}
      onMouseEnter={() => onHover && onHover(item.id)}
      onMouseLeave={() => onHover && onHover(null)}
      onClick={() => onClick && onClick(item)}
    >
      {/* Thumbnail */}
      {item.images?.[0] && (
        <img
          src={item.images[0]}
          alt="Thumbnail"
          className="w-20 h-20 object-cover rounded-lg mr-4 flex-shrink-0"
        />
      )}

      {/* Nội dung */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-800 text-lg truncate">{item.title}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {item.description || 'Không có mô tả'}
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
            item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'
          }`}>
            {item.type === 'LOST' ? 'Báo mất' : 'Nhặt được'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
            {dateStr}
          </span>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {isOwner ? (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-lg 
                       hover:bg-yellow-200 hover:shadow transition flex items-center gap-1"
          >
            ✏️ Sửa
          </button>
        ) : (
          <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
            Xem chi tiết →
          </div>
        )}
      </div>
    </div>
  );
}