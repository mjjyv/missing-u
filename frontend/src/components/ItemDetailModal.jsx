import React, { useState, useEffect } from 'react'; // [BƯỚC 1] Thêm useEffect
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';


// Component con hiển thị thẻ tin khớp thu nhỏ (Mini Card)
const MatchItemCard = ({ matchItem, onClick }) => (
  <div 
    onClick={() => onClick(matchItem)}
    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition bg-white shadow-sm min-w-[250px]"
  >
    <img 
      src={matchItem.images?.[0] || 'https://via.placeholder.com/150'} 
      alt="Thumbnail" 
      className="w-12 h-12 rounded object-cover border"
    />
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-sm text-gray-800 truncate">{matchItem.title}</h4>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${matchItem.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
          {matchItem.type === 'LOST' ? 'MẤT' : 'NHẶT'}
        </span>
        {/* Hiển thị độ khớp nếu có */}
        {matchItem.score && (
            <span className="text-xs font-bold text-blue-600">
                {Math.round(matchItem.score)}% khớp
            </span>
        )}
      </div>
    </div>
  </div>
);


export default function ItemDetailModal({ item, onClose, onUpdateList }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // [BƯỚC 1] QUẢN LÝ TRẠNG THÁI (State Management)
  const [matches, setMatches] = useState([]); // Danh sách tin khớp
  const [loadingMatches, setLoadingMatches] = useState(false); // Trạng thái loading


  // [MỚI] State cho Quy trình Claim (Handshake)
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimDesc, setClaimDesc] = useState('');
  const [claimFile, setClaimFile] = useState(null);
  const [claimPreview, setClaimPreview] = useState(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false); // Trạng thái: Người dùng đã gửi claim chưa?

  

  // Kiểm tra quyền chủ sở hữu
  const isOwner = user && Number(user.id) === Number(item?.user_id);

  // Fetch dữ liệu Matching & Kiểm tra trạng thái Claim (Song song)
  useEffect(() => {
    if (item?.id) {
      let isMounted = true;

      const fetchData = async () => {
        setLoadingMatches(true);
        try {
          // Fetch Matching (Logic cũ)
          const matchRes = await axiosClient.get(`/items/${item.id}/matches`);
          if (isMounted) {
            setMatches(matchRes.data.data.filter(m => m.id !== item.id));
          }
          
          // [MỚI] Kiểm tra xem User hiện tại đã claim bài này chưa?
          // Lưu ý: Backend cần hỗ trợ route này, hoặc ta xử lý lỗi duplicate khi submit.
          // Tạm thời ta reset form mỗi khi mở item mới.
          setShowClaimForm(false);
          setClaimDesc('');
          setClaimFile(null);
          setClaimPreview(null);
          setHasClaimed(false); 

        } catch (err) {
          console.error("Lỗi tải dữ liệu:", err);
        } finally {
          if (isMounted) setLoadingMatches(false);
        }
      };

      fetchData();
      return () => { isMounted = false; };
    }
  }, [item]);

  // 2. --- HANDLERS XỬ LÝ SỰ KIỆN ---
  
  // Xử lý chọn ảnh bằng chứng
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClaimFile(file);
      setClaimPreview(URL.createObjectURL(file));
    }
  };

  // Gửi Claim lên Server
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!claimDesc.trim()) return alert("Vui lòng nhập mô tả đặc điểm!");
    
    setSubmittingClaim(true);
    const formData = new FormData();
    formData.append('proof_description', claimDesc);
    if (claimFile) {
        formData.append('proof', claimFile); // Key 'proof' phải khớp với uploadCloud.array('proof') ở Backend
    }

    try {
        await axiosClient.post(`/claims/${item.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("✅ Đã gửi yêu cầu xác minh thành công! Chủ bài đăng sẽ xem xét.");
        setShowClaimForm(false);
        setHasClaimed(true); // Cập nhật trạng thái UI
    } catch (err) {
        const msg = err.response?.data?.message || "Lỗi gửi yêu cầu";
        alert("❌ " + msg);
        if (msg.includes("đã gửi yêu cầu")) {
            setHasClaimed(true); // Nếu lỗi là do trùng lặp, cũng set là đã gửi
        }
    } finally {
        setSubmittingClaim(false);
    }
  };

  if (!item) return null;

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
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
              <div className="w-full h-full flex items-center justify-center text-red-500">
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

          {/* === [MỚI] FORM GỬI YÊU CẦU (HANDSHAKE PROTOCOL) === */}
          {!isOwner && user && ( // Chỉ hiện với người lạ đã đăng nhập
             <div className="mb-6 border-t pt-4">
                {hasClaimed ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center">
                        <p className="font-bold text-lg">🎉 Đã gửi yêu cầu!</p>
                        <p className="text-sm">Vui lòng chờ chủ bài đăng xác minh. Hệ thống sẽ thông báo khi có kết quả.</p>
                    </div>
                ) : !showClaimForm ? (
                    // Nút Kích hoạt Form
                    <button 
                        onClick={() => setShowClaimForm(true)}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition flex items-center justify-center gap-2"
                    >
                        <span>✋</span> ĐÂY LÀ ĐỒ CỦA TÔI / TÔI ĐANG GIỮ NÓ
                    </button>
                ) : (
                    // Form Nhập liệu (Secure Snap)
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                🔒 Xác minh quyền sở hữu
                            </h3>
                            <button onClick={() => setShowClaimForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Đóng</button>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-4 bg-yellow-50 p-2 rounded border border-yellow-100">
                            🛡️ <b>Secure Snap:</b> Ảnh bằng chứng bạn gửi sẽ được làm mờ mặc định để bảo vệ quyền riêng tư. Chỉ chủ bài đăng mới có thể xem.
                        </p>

                        <form onSubmit={handleSubmitClaim} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả đặc điểm nhận dạng (*)</label>
                                <textarea 
                                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows="3"
                                    placeholder="Ví dụ: Trong ví có tờ 2 đô la seri đuôi 99, hoặc vết xước nhỏ ở mặt sau..."
                                    value={claimDesc}
                                    onChange={e => setClaimDesc(e.target.value)}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Ảnh bằng chứng (Tùy chọn)</label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition text-sm flex items-center gap-2">
                                        📷 Tải ảnh lên
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                    {claimPreview && (
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border group">
                                            {/* Hiệu ứng Blur demo Secure Snap */}
                                            <img src={claimPreview} alt="Preview" className="w-full h-full object-cover blur-[2px] group-hover:blur-0 transition" />
                                            <button 
                                                type="button" 
                                                onClick={() => {setClaimFile(null); setClaimPreview(null)}}
                                                className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-[10px]"
                                            >✕</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={submittingClaim}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                            >
                                {submittingClaim ? 'Đang gửi mã hóa...' : '🚀 GỬI YÊU CẦU BẢO MẬT'}
                            </button>
                        </form>
                    </div>
                )}
             </div>
          )}

          {/* === [MỚI] PHẦN HIỂN THỊ TIN TRÙNG KHỚP === */}
          {/* Chỉ hiển thị nếu có tin trùng khớp hoặc đang loading */}
          {(matches.length > 0 || loadingMatches) && (
            <div className="mb-6 pt-4 border-t border-dashed border-gray-300">
              <h3 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
                🤖 Gợi ý từ AI 
                {loadingMatches && <span className="text-xs font-normal text-gray-400 animate-pulse">(Đang phân tích...)</span>}
              </h3>
              
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-gray-300">
                {loadingMatches ? (
                  // Skeleton Loading (Hiệu ứng chờ)
                  [1, 2].map(i => (
                    <div key={i} className="min-w-[250px] h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                  ))
                ) : matches.length > 0 ? (
                  matches.map(match => (
                    <MatchItemCard 
                        key={match.id} 
                        matchItem={match} 
                        onClick={(m) => {
                            // Logic khi click vào tin gợi ý: 
                            // Có thể đóng modal hiện tại và mở modal mới, hoặc điều hướng
                            alert(`Chuyển sang xem tin: ${m.title}`);
                        }} 
                    />
                  ))
                ) : null}
              </div>
            </div>
          )}
          {/* =========================================== */}

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
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-gray-600 font-bold shadow-lg transition"
                >
                  🗑️ Xóa bài
                </button>
              </div>
            ) : (
              <button className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg transition">
                📞 LIÊN HỆ NGAY
              </button>
            )}

            {/* Nút đăng nhập nếu là khách */}
          {!user && (
             <div className="mt-6 pt-4 border-t">
                <button onClick={() => navigate('/login')} className="w-full bg-primary text-white py-3 rounded-xl font-bold">🔑 ĐĂNG NHẬP ĐỂ LIÊN HỆ</button>
             </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}