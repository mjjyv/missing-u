import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

// Mini Card cho gợi ý AI
const MatchItemCard = ({ matchItem, onClick }) => (
  <div
    onClick={() => onClick(matchItem)}
    className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:bg-blue-50 cursor-pointer transition-all duration-300 shadow-sm min-w-[280px] snap-start"
  >
    <img
      src={matchItem.images?.[0] || 'https://via.placeholder.com/80'}
      alt="Thumbnail"
      className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow"
    />
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-sm text-gray-900 truncate leading-tight">{matchItem.title}</h4>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs px-3 py-1 rounded-full font-bold text-white ${
          matchItem.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {matchItem.type === 'LOST' ? 'MẤT' : 'NHẶT'}
        </span>
        {matchItem.score && (
          <span className="text-sm font-bold text-blue-600">
            {Math.round(matchItem.score)}% khớp
          </span>
        )}
      </div>
    </div>
  </div>
);

// Component hiển thị từng yêu cầu claim (dành cho owner)
const ClaimRequestItem = ({ claim, onVerify }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={`p-5 rounded-2xl border-2 shadow-md transition-all mb-4 ${
      claim.status === 'ACCEPTED' ? 'bg-green-50 border-green-300' :
      claim.status === 'REJECTED' ? 'bg-red-50 border-red-300' :
      'bg-blue-50 border-blue-300'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {claim.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{claim.full_name || 'Người dùng'}</p>
            <p className="text-xs text-gray-500">{new Date(claim.created_at).toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
          claim.status === 'ACCEPTED' ? 'bg-green-600 text-white' :
          claim.status === 'REJECTED' ? 'bg-red-600 text-white' :
          'bg-yellow-500 text-white'
        }`}>
          {claim.status === 'PENDING' ? 'Đang chờ' :
           claim.status === 'ACCEPTED' ? 'Đã chấp nhận' : 'Đã từ chối'}
        </span>
      </div>

      <div className="bg-white/80 p-4 rounded-xl mb-4 border">
        <p className="text-sm italic text-gray-700 leading-relaxed">"{claim.proof_description}"</p>
      </div>

      {claim.proof_image && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
            🔒 Ảnh bằng chứng (Secure Snap)
          </p>
          <div
            className="relative w-full h-48 rounded-xl overflow-hidden cursor-pointer group border-2 border-dashed border-gray-300"
            onClick={() => setIsRevealed(!isRevealed)}
          >
            <img
              src={claim.proof_image}
              alt="Bằng chứng"
              className={`w-full h-full object-contain transition-all duration-500 ${
                isRevealed ? 'blur-0' : 'blur-3xl'
              }`}
            />
            {!isRevealed && (
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                <span className="text-4xl mb-2">👁️</span>
                <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded">
                  Nhấn để xem rõ
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {claim.status === 'PENDING' && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onVerify(claim.id, 'ACCEPTED')}
            className="py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg transition"
          >
            ✅ Chấp nhận
          </button>
          <button
            onClick={() => onVerify(claim.id, 'REJECTED')}
            className="py-3 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 shadow-lg transition"
          >
            ❌ Từ chối
          </button>
        </div>
      )}

      {claim.status === 'ACCEPTED' && (
        <div className="mt-3 p-4 bg-green-100 rounded-xl text-center border border-green-300">
          <p className="font-bold text-green-800">🎉 Đã kết nối thành công!</p>
          <p className="text-sm mt-1">Email: <span className="font-mono">{claim.email}</span></p>
        </div>
      )}
    </div>
  );
};

export default function ItemDetailModal({ item, onClose, onUpdateList }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State chung
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // State cho owner: danh sách yêu cầu đến
  const [incomingClaims, setIncomingClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // State cho người xem: claim của mình
  const [myClaim, setMyClaim] = useState(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimDesc, setClaimDesc] = useState('');
  const [claimFile, setClaimFile] = useState(null);
  const [claimPreview, setClaimPreview] = useState(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const isOwner = user && item && Number(user.id) === Number(item.user_id);

  // Fetch dữ liệu song song
  useEffect(() => {
    if (item?.id) {
      let isMounted = true;
      
      // === [FIX] RESET TOÀN BỘ STATE CŨ KHI MỞ ITEM MỚI ===
      setIncomingClaims([]); // Xóa danh sách yêu cầu của item trước
      setMyClaim(null);      // Xóa claim của chính mình ở item trước
      setMatches([]);        // Xóa tin khớp cũ
      setShowClaimForm(false);
      setClaimDesc('');
      setClaimFile(null);
      setClaimPreview(null);
      // ====================================================

      const fetchData = async () => {
        try {
          // 1. Tải Matches (AI)
          setLoadingMatches(true);
          const matchRes = await axiosClient.get(`/items/${item.id}/matches`);
          if (isMounted) setMatches(matchRes.data.data.filter(m => m.id !== item.id));

          // 2. Nếu là Owner -> Tải danh sách Claims dành riêng cho Item này
          if (user && Number(user.id) === Number(item.user_id)) {
             setLoadingClaims(true);
             // Gọi API lấy claim theo item_id
             const claimsRes = await axiosClient.get(`/claims/item/${item.id}`);
             if (isMounted) setIncomingClaims(claimsRes.data.data);
             setLoadingClaims(false);
          }

          // 3. Nếu là Người lạ -> Tải Claim của chính mình trên Item này
          if (user && Number(user.id) !== Number(item.user_id)) {
             const myClaimRes = await axiosClient.get(`/claims/my-claim/${item.id}`);
             if (isMounted && myClaimRes.data.data) {
                setMyClaim(myClaimRes.data.data);
             }
          }

        } catch (err) {
          console.error("Lỗi tải dữ liệu chi tiết:", err);
        } finally {
          if (isMounted) setLoadingMatches(false);
        }
      };
      
      fetchData();
      return () => { isMounted = false; };
    }
  }, [item, user]); // Chạy lại khi item hoặc user thay đổi

  // Xử lý verify claim (owner)
  const handleVerifyClaim = async (claimId, status) => {
    if (!window.confirm(`Bạn chắc chắn muốn ${status === 'ACCEPTED' ? 'CHẤP NHẬN' : 'TỪ CHỐI'} yêu cầu này?`)) return;

    try {
      const res = await axiosClient.put(`/claims/${claimId}/status`, { status });
      setIncomingClaims(prev => 
        prev.map(c => c.id === claimId ? { ...c, status: res.data.data.status } : c)
      );
      alert('Đã cập nhật trạng thái!');
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // Xử lý gửi claim (người xem)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClaimFile(file);
      setClaimPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!claimDesc.trim()) return alert('Vui lòng nhập mô tả đặc điểm!');

    setSubmittingClaim(true);
    const formData = new FormData();
    formData.append('proof_description', claimDesc);
    if (claimFile) formData.append('proof', claimFile);

    try {
      const res = await axiosClient.post(`/claims/${item.id}`, formData);
      setMyClaim(res.data.data);
      alert('✅ Đã gửi yêu cầu thành công!');
      setShowClaimForm(false);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi gửi yêu cầu'));
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Xử lý xóa/sửa (owner)
  const handleDelete = async () => {
    if (!window.confirm('Xóa bài viết này? Không thể khôi phục.')) return;
    try {
      await axiosClient.delete(`/items/${item.id}`);
      alert('Đã xóa thành công!');
      onClose();
      if (onUpdateList) onUpdateList();
    } catch (err) {
      alert('Lỗi xóa bài');
    }
  };

  const handleEditRedirect = () => {
    onClose();
    navigate(`/edit-item/${item.id}`);
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
        {/* Header ảnh */}
        <div className="relative h-72 shrink-0 bg-gradient-to-b from-gray-100 to-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/90 p-3 rounded-full hover:bg-white shadow-xl text-2xl font-bold"
          >
            ✕
          </button>
          <div className="flex overflow-x-auto h-full snap-x scrollbar-hide">
            {item.images?.length > 0 ? (
              item.images.map((img, i) => (
                <img key={i} src={img} className="h-full w-full object-contain snap-center shrink-0" alt={`Hình ${i + 1}`} />
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                Không có hình ảnh
              </div>
            )}
          </div>
        </div>

        {/* Nội dung */}
        <div className="p-6 overflow-y-auto">
          {/* Thông tin cơ bản */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {item.author_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{item.author_name || 'Người dùng ẩn danh'}</p>
                  <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <span className={`px-5 py-2 rounded-full text-sm font-bold text-white ${
                item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'
              }`}>
                {item.type === 'LOST' ? 'TIN BÁO MẤT' : 'TIN NHẶT ĐƯỢC'}
              </span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h2>

            {item.attributes && Object.keys(item.attributes).length > 0 && (
              <div className="flex flex-wrap gap-3 mb-5">
                {Object.entries(item.attributes).map(([key, value]) => (
                  <span key={key} className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                    <span className="font-bold capitalize">{key}:</span> {value}
                  </span>
                ))}
              </div>
            )}

            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line mb-8">
              {item.description}
            </p>
          </div>

          {/* === DÀNH CHO OWNER: DANH SÁCH YÊU CẦU === */}
          {isOwner && (
            <div className="mb-8 pb-8 border-b-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                📋 Yêu cầu nhận đồ ({incomingClaims.length})
              </h3>

              {loadingClaims ? (
                <div className="text-center py-8 text-gray-500">Đang tải yêu cầu...</div>
              ) : incomingClaims.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl text-gray-500">
                  Chưa có ai gửi yêu cầu nhận món đồ này.
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingClaims.map(claim => (
                    <ClaimRequestItem key={claim.id} claim={claim} onVerify={handleVerifyClaim} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === DÀNH CHO NGƯỜI XEM: GỬI YÊU CẦU === */}
          {!isOwner && user && (
            <div className="mb-8 pb-8 border-b-2 border-gray-200">
              {myClaim ? (
                <div className={`p-6 rounded-3xl border-2 shadow-lg ${
                  myClaim.status === 'ACCEPTED' ? 'bg-green-50 border-green-300' :
                  myClaim.status === 'REJECTED' ? 'bg-red-50 border-red-300' :
                  'bg-blue-50 border-blue-300'
                }`}>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">📤 Yêu cầu xác minh của bạn</h3>
                  <p className="text-sm mb-3">
                    Trạng thái: <strong>{myClaim.status === 'PENDING' ? 'Đang chờ duyệt' : myClaim.status === 'ACCEPTED' ? 'Đã được chấp nhận' : 'Bị từ chối'}</strong>
                  </p>
                  <div className="bg-white/70 p-4 rounded-xl mb-4">
                    <p className="italic text-gray-700">"{myClaim.proof_description}"</p>
                  </div>
                  {myClaim.proof_image && (
                    <img src={myClaim.proof_image} alt="Bằng chứng" className="w-32 h-32 object-cover rounded-xl border shadow mb-4" />
                  )}
                  {myClaim.status === 'ACCEPTED' && (
                    <button className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:bg-green-700 transition">
                      💬 MỞ CHAT VỚI CHỦ BÀI
                    </button>
                  )}
                </div>
              ) : (
                !showClaimForm ? (
                  <button
                    onClick={() => setShowClaimForm(true)}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-3xl shadow-2xl hover:shadow-3xl transition transform hover:scale-[1.02]"
                  >
                    ✋ ĐÂY LÀ ĐỒ CỦA TÔI / TÔI ĐANG GIỮ
                  </button>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-7 rounded-3xl border-2 border-blue-200">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-2xl font-bold text-gray-800">🔒 Xác minh quyền sở hữu</h3>
                      <button onClick={() => setShowClaimForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                    </div>

                    <p className="text-sm bg-yellow-100 text-yellow-800 p-4 rounded-xl mb-6 border border-yellow-200">
                      🛡️ <strong>Secure Snap:</strong> Ảnh bằng chứng sẽ được bảo mật. Chỉ chủ bài mới có thể xem rõ.
                    </p>

                    <form onSubmit={handleSubmitClaim} className="space-y-5">
                      <textarea
                        className="w-full p-5 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300 outline-none resize-none text-base"
                        rows="5"
                        placeholder="Mô tả đặc điểm chỉ bạn biết (vết xước, số seri, vật kèm theo...)"
                        value={claimDesc}
                        onChange={e => setClaimDesc(e.target.value)}
                        required
                      />

                      <div>
                        <label className="block text-lg font-semibold mb-3">Ảnh bằng chứng (khuyến khích)</label>
                        <div className="flex items-center gap-5">
                          <label className="px-6 py-4 bg-white border-2 border-dashed border-gray-400 rounded-2xl cursor-pointer hover:border-blue-500 transition text-base">
                            📷 Chọn ảnh
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                          </label>
                          {claimPreview && (
                            <div className="relative group">
                              <img src={claimPreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border-2 blur-lg group-hover:blur-0 transition duration-300" />
                              <button
                                type="button"
                                onClick={() => { setClaimFile(null); setClaimPreview(null); }}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 text-sm -translate-y-1 translate-x-1"
                              >✕</button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingClaim}
                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl disabled:opacity-70 transition"
                      >
                        {submittingClaim ? 'Đang gửi bảo mật...' : '🚀 GỬI YÊU CẦU XÁC MINH'}
                      </button>
                    </form>
                  </div>
                )
              )}
            </div>
          )}

          {/* === GỢI Ý AI === */}
          {(matches.length > 0 || loadingMatches) && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                🤖 Gợi ý từ AI
                {loadingMatches && <span className="text-sm text-gray-500 animate-pulse">(đang tìm...)</span>}
              </h3>

              <div className="flex gap-5 overflow-x-auto pb-4 snap-x scrollbar-thin">
                {loadingMatches ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="min-w-[280px] h-32 bg-gray-200 rounded-2xl animate-pulse" />
                  ))
                ) : (
                  matches.map(match => (
                    <MatchItemCard
                      key={match.id}
                      matchItem={match}
                      onClick={() => alert(`Xem tin gợi ý: ${match.title}`)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* === NÚT HÀNH ĐỘNG CHÍNH === */}
          <div className="pt-6 border-t-2 border-gray-200">
            {isOwner ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleEditRedirect}
                  className="py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition"
                >
                  ✏️ Sửa bài
                </button>
                <button
                  onClick={handleDelete}
                  className="py-5 bg-red-600 text-white font-bold text-lg rounded-2xl shadow-2xl hover:bg-red-700 transition"
                >
                  🗑️ Xóa bài
                </button>
              </div>
            ) : (
              <button className="w-full py-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-2xl font-bold rounded-3xl shadow-2xl hover:shadow-3xl transition transform hover:scale-[1.02]">
                📞 LIÊN HỆ NGAY
              </button>
            )}

            {!user && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 font-bold text-lg hover:underline"
                >
                  🔑 Đăng nhập để gửi yêu cầu hoặc liên hệ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}