import React, { useState } from 'react';

export default function ClaimRequestItem({ claim, onAccept, onReject }) {
  // State quản lý việc "vén màn" ảnh bảo mật
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl p-4 mb-3 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-800">{claim.full_name}</h4>
          <span className="text-xs text-gray-500">
            {new Date(claim.created_at).toLocaleString('vi-VN')}
          </span>
        </div>
        
        {/* Badge trạng thái */}
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          claim.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
          claim.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 
          'bg-gray-100 text-gray-500'
        }`}>
          {claim.status}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
        💬 "{claim.proof_description}"
      </p>

      {/* --- SECURE SNAP SECTION --- */}
      {claim.proof_image && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
            🔒 ẢNH BẰNG CHỨNG (BẢO MẬT)
          </p>
          
          <div 
            className="relative w-full h-40 rounded-lg overflow-hidden cursor-pointer group border"
            onClick={() => setIsRevealed(!isRevealed)}
          >
            {/* Ảnh gốc */}
            <img 
              src={claim.proof_image} 
              alt="Proof" 
              className={`w-full h-full object-cover transition-all duration-500 ${
                isRevealed ? 'blur-0' : 'blur-xl scale-110' // CSS Filter Blur
              }`} 
            />

            {/* Lớp phủ hướng dẫn (Chỉ hiện khi ảnh đang mờ) */}
            {!isRevealed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/10 transition">
                <span className="text-3xl">👁️</span>
                <span className="text-white text-xs font-bold mt-1 shadow-black drop-shadow-md">
                  Chạm để xem ảnh
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons (Chỉ hiện khi Pending) */}
      {claim.status === 'PENDING' && (
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => onAccept(claim.id)}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 text-sm"
          >
            ✅ Chấp nhận
          </button>
          <button 
            onClick={() => onReject(claim.id)}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 text-sm"
          >
            ❌ Từ chối
          </button>
        </div>
      )}
    </div>
  );
}