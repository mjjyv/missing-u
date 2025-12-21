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

  

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      const res = await axiosClient.get('/items/my-posts');
      setPosts(res.data.data);
      setFilteredPosts(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Lỗi tải bài đăng:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = posts;
    if (activeTab !== 'All') {
      filtered = filtered.filter(post => post.status === activeTab.toUpperCase());
    }
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPosts(filtered);
  }, [activeTab, searchQuery, posts]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  }

  if (!user) {
    return <div className="text-center mt-10">Vui lòng đăng nhập để xem hồ sơ.</div>;
  }

  // Tính toán thống kê
  const totalPosts = posts.length;
  const resolvedPosts = posts.filter(p => p.status === 'RESOLVED').length;
  const resolvedRate = totalPosts > 0 ? ((resolvedPosts / totalPosts) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Phần info user */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-700">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user.full_name || 'Người dùng'}</h2>
            <p className="text-sm text-gray-600">Điểm uy tín: {user.trust_score || 0}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-bold text-lg">{totalPosts}</p>
            <p className="text-xs text-gray-500">Bài đăng</p>
          </div>
          <div>
            <p className="font-bold text-lg">{resolvedPosts}</p>
            <p className="text-xs text-gray-500">Đã giải quyết</p>
          </div>
          <div>
            <p className="font-bold text-lg">{resolvedRate}%</p>
            <p className="text-xs text-gray-500">Tỉ lệ thành công</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border rounded-lg text-sm"
        />
      </div>

      {/* Tab lọc */}
      <div className="max-w-2xl mx-auto mb-4 flex gap-2">
        {['All', 'Pending', 'Resolved'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab === tab ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {tab === 'All' ? 'Tất cả' : tab === 'Pending' ? 'Đang chờ' : 'Đã giải quyết'}
          </button>
        ))}
      </div>

      {/* Danh sách bài đăng */}
      <div className="max-w-2xl mx-auto space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <ItemCard 
              key={post.id} 
              item={post} 
              onViewDetails={setDetailItem}
            />
          ))
        ) : (
          <div className="text-center text-gray-500">
            Không có bài đăng nào. <a href="/post-item" className="text-primary">Bắt đầu đăng tin ngay!</a>
          </div>
        )}
      </div>

      {/* Modal chi tiết */}
      {detailItem && (
        <ItemDetailModal 
          item={detailItem} 
          onClose={() => setDetailItem(null)} 
          onUpdateList={fetchMyPosts} // Refresh danh sách sau sửa/xóa
        />
      )}
    </div>
  );
}