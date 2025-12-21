import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MatchModal({ matches, onClose }) {
  const navigate = useNavigate();

  if (!matches || matches.length === 0) return null;

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-bounce-in">
        <div className="bg-gradient-to- from-gray-500 to-red-500 p-6 text-white text-center">
          <div className="text-4xl mb-2">🔍</div>
          <h2 className="text-2xl font-bold">Tìm thấy kết quả trùng khớp!</h2>
          <p className="text-sm opacity-90">Chúng tôi tìm thấy {matches.length} vật phẩm có đặc điểm tương đồng với tin của bạn.</p>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {matches.map((item) => (
            <div 
              key={item.id}
              className="flex items-center p-3 mb-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition"
              onClick={() => navigate('/explore')} // Hoặc dẫn tới trang chi tiết
            >
              <img src={item.images?.[0]} className="w-16 h-16 object-cover rounded-lg mr-4 border" alt="" />
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-sm uppercase">{item.title}</h4>
                <div className="flex items-center justify-between mt-1">
                   <span className="text-xs text-gray-500 font-bold">Độ khớp: {Math.round(item.total_score)}%</span>
                   <span className="text-[10px] text-gray-400 italic">Cách đây {Math.round(item.distance / 1000)}km</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition"
          >
            Đóng
          </button>
          <button 
            onClick={() => navigate('/explore')}
            className="flex-1 py-3 bg-gray-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition"
          >
            Kiểm tra ngay
          </button>
        </div>
      </div>
    </div>
  );
}