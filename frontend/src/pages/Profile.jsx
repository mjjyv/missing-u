import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ItemCard from '../components/ItemCard';
import ItemDetailModal from '../components/ItemDetailModal';

export default function Profile() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailItem, setDetailItem] = useState(null);

  // Fetch bài đăng của người dùng hiện tại
  const fetchMyPosts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await axiosClient.get('/items/my-posts');
      const data = res.data.data || [];
      setPosts(data);
      setFilteredPosts(data);
    } catch (err) {
      console.error('Lỗi tải bài đăng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [user]);

  // Lọc theo tab + tìm kiếm
  useEffect(() => {
    let filtered = posts;

    // Lọc theo trạng thái
    if (activeTab !== 'All') {
      filtered = filtered.filter(post => post.status === activeTab.toUpperCase());
    }

    // Tìm kiếm theo tiêu đề/mô tả
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        (post.description && post.description.toLowerCase().includes(query))
      );
    }

    setFilteredPosts(filtered);
  }, [posts, activeTab, searchQuery]);

  // Tính toán thống kê
  const totalPosts = posts.length;
  const resolvedPosts = posts.filter(p => p.status === 'RESOLVED').length;
  const resolvedRate = totalPosts > 0 ? ((resolvedPosts / totalPosts) * 100).toFixed(0) : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Vui lòng đăng nhập để xem hồ sơ cá nhân</p>
          <a href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Profile */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold shadow-2xl">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{user.full_name || 'Người dùng'}</h1>
              <p className="text-lg opacity-90">{user.email}</p>
              <p className="text-sm mt-2 opacity-80">Điểm uy tín: <span className="font-bold">{user.trust_score || 0}</span> ⭐</p>
            </div>
          </div>

          {/* Thống kê */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 text-center">
              <p className="text-4xl font-bold">{totalPosts}</p>
              <p className="text-sm mt-1 opacity-90">Bài đăng</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 text-center">
              <p className="text-4xl font-bold text-green-200">{resolvedPosts}</p>
              <p className="text-sm mt-1 opacity-90">Đã giải quyết</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 text-center">
              <p className="text-4xl font-bold text-yellow-200">{resolvedRate}%</p>
              <p className="text-sm mt-1 opacity-90">Tỉ lệ thành công</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Tabs (Sticky trên mobile) */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-5 sticky top-4">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm trong bài đăng của bạn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none mb-4"
          />

          <div className="grid grid-cols-3 gap-3">
            {['All', 'Pending', 'Resolved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'All' ? 'Tất cả' : tab === 'Pending' ? 'Đang tìm' : 'Đã xong'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danh sách bài đăng */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Đang tải bài đăng...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-5">
            {filteredPosts.map((post) => (
              <ItemCard
                key={post.id}
                item={post}
                onClick={() => setDetailItem(post)}
                isHovered={false}
                onHover={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
            <p className="text-xl text-gray-600 mb-6">
              {searchQuery || activeTab !== 'All'
                ? 'Không tìm thấy bài đăng phù hợp'
                : 'Bạn chưa có bài đăng nào'}
            </p>
            <a
              href="/post-item"
              className="inline-block px-8 py-4 bg-linear-to-r from-black-800 to-purple-800 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105"
            >
              📝 Đăng tin mới ngay!
            </a>
          </div>
        )}
      </div>

      {/* Modal chi tiết bài đăng */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onUpdateList={fetchMyPosts} // Refresh khi sửa/xóa
        />
      )}
    </div>
  );
}