import React from 'react';

export default function ItemCard({ item, isHovered, onHover, onClick }) {
  const dateStr = new Date(item.created_at).toLocaleDateString('vi-VN');

  return (
    <div 
      id={`item-${item.id}`}
      className={`flex p-4 mb-4 bg-white rounded-xl shadow-sm cursor-pointer transition-all duration-300 border-l-4 
        ${item.type === 'LOST' ? 'border-red-500' : 'border-green-500'}
        ${isHovered ? 'bg-blue-50 ring-2 ring-blue-300' : 'hover:shadow-md'}
      `}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(item)}
    >
      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border">
        {item.images && item.images.length > 0 ? (
          <img src={item.images[0]} alt="Thumbnail" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No Image</div>
        )}
      </div>

      <div className="ml-4 flex-1">
        <div className="flex justify-between items-start">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
            {item.type === 'LOST' ? 'BÁO MẤT' : 'NHẶT ĐƯỢC'}
          </span>
          <span className="text-[10px] text-gray-500 italic">{dateStr}</span>
        </div>
        <h3 className="font-bold text-gray-800 text-sm mt-1 line-clamp-1 uppercase">{item.title}</h3>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
        
        <div className="mt-2 flex gap-1 flex-wrap">
           {item.attributes?.color && (
             <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 border">
               🎨 {item.attributes.color}
             </span>
           )}
           {item.attributes?.brand && (
             <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 border">
               🏷️ {item.attributes.brand}
             </span>
           )}
        </div>
      </div>
    </div>
  );
}