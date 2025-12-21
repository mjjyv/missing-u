import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

export default function NotificationMenu() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Fetch thông báo
  const fetchNotifications = async () => {
    try {
      const res = await axiosClient.get('/claims/notifications/pending');
      setNotifications(res.data.data);
      setUnreadCount(res.data.data.length);
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);
    }
  };

  // Polling: Tự động cập nhật mỗi 30 giây (hoặc gọi khi mount)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (item) => {
    // Điều hướng đến Profile hoặc trang chi tiết để xử lý
    // Ở đây ta chuyển hướng về Profile để Owner thấy danh sách bài đăng của mình
    setIsOpen(false);
    navigate('/profile'); 
  };

  return (
    <div className="relative z-50" ref={menuRef}>
      {/* Icon Chuông */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-600 hover:text-blue-600 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge số lượng */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-down">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-bold text-gray-700">Thông báo ({unreadCount})</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.claim_id}
                  onClick={() => handleItemClick(notif)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition last:border-0"
                >
                  <div className="flex gap-3">
                    {/* Ảnh thumbnail bài đăng */}
                    <img 
                      src={notif.item_images?.[0] || 'https://via.placeholder.com/50'} 
                      alt="Item" 
                      className="w-10 h-10 rounded object-cover border"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        <span className="font-bold">{notif.claimer_name}</span> muốn nhận: 
                        <span className="font-semibold text-blue-600"> {notif.item_title}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                Không có thông báo mới
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-2 text-center border-t border-gray-200">
            <button onClick={() => navigate('/profile')} className="text-xs font-bold text-blue-600 hover:underline">
              Quản lý tất cả bài đăng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}