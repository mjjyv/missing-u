import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ItemCard({ 
  item, 
  onClick, 
  isHovered, 
  onHover 
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dateStr = new Date(item.created_at).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const isOwner = user && Number(user.id) === Number(item.user_id);
  const isCurrentlyHovered = isHovered === item.id;

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/edit-item/${item.id}`);
  };

  return (
    <div
      id={`item-${item.id}`}
      className={`
        relative bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer
        transition-all duration-300 border border-gray-100 mb-2.5
        ${item.type === 'LOST' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}
        ${isCurrentlyHovered 
          ? 'shadow-xl ring-2 ring-blue-200 ring-opacity-50 scale-[1.02] translate-y-1' 
          : 'hover:shadow-lg hover:scale-[1.01] hover:translate-y-0.5'
        }
      `}
      onMouseEnter={() => onHover && onHover(item.id)}
      onMouseLeave={() => onHover && onHover(null)}
      onClick={() => onClick && onClick(item)}
    >
      <div className="flex p-5">
        {/* Thumbnail */}
        {item.images?.[0] ? (
          <div className="shrink-0 mr-4">
            <img
              src={item.images[0]}
              alt="Thumbnail"
              className="w-24 h-24 object-cover rounded-xl shadow-md"
            />
          </div>
        ) : (
          <div className="shrink-0 mr-4 w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center">
            <span className="text-gray-400 text-3xl">📦</span>
          </div>
        )}

        {/* Nội dung */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 leading-tight mb-2">
            {item.title}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {item.description || 'Không có mô tả'}
          </p>

          <div className="flex flex-wrap mb-1 items-center gap-3 text-xs">
            <span className={`px-3 py-1.5 rounded-full font-medium text-white ${
              item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'
            }`}>
              {item.type === 'LOST' ? 'Báo mất' : 'Nhặt được'}
            </span>
            
          </div>

          <div className='flex flex-wrap items-center gap-3 text-xs'>
            <span className="text-gray-500 flex items-center gap-1">
              📅 {dateStr}
            </span>
          </div>
        </div>
      </div>

      {/* Nút hành động - nổi ở góc phải dưới */}
      <div className="absolute bottom-4 right-4">
        {isOwner ? (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white font-medium text-sm rounded-full shadow-lg hover:shadow-xl transition flex items-center gap-1.5"
          >
            ✏️ Sửa bài
          </button>
        ) : (
          <div className="px-4 py-2 bg-gray-100 text-gray-600 font-medium text-sm rounded-full">
            Xem chi tiết →
          </div>
        )}
      </div>
    </div>
  );
}