import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

// Kết nối Socket Server (Lưu ý Port 5000 phải khớp với Backend)
const SOCKET_URL = 'http://localhost:5000'; 

export default function ChatBox({ claimId, partnerName, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  
  // Ref để tự động cuộn xuống cuối khi có tin mới
  const messagesEndRef = useRef(null);

  // 1. Khởi tạo Socket & Tham gia phòng
  useEffect(() => {
    // Tạo kết nối
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Gửi sự kiện tham gia phòng
    newSocket.emit('join_chat', claimId);

    // Lắng nghe tin nhắn đến
    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Cleanup khi đóng chat
    return () => {
      newSocket.disconnect();
    };
  }, [claimId]);

  // 2. Tải lịch sử tin nhắn cũ từ API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axiosClient.get(`/chat/${claimId}`);
        setMessages(res.data.data);
      } catch (err) {
        console.error("Lỗi tải lịch sử chat:", err);
      }
    };
    fetchHistory();
  }, [claimId]);

  // 3. Tự động cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Gửi tin nhắn
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      claimId: claimId,
      senderId: user.id,
      content: newMessage
    };

    // Gửi qua Socket (Server sẽ lưu DB và phát lại cho mọi người)
    socket.emit('send_message', messageData);
    
    setNewMessage('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-white rounded-t-xl shadow-2xl border border-gray-200 z-[10000] flex flex-col h-[500px] animate-fade-in-up">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-xl flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="w-2 h-2 bg-green-400 rounded-full absolute bottom-0 right-0 border border-blue-600"></span>
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center font-bold">
              {partnerName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm">{partnerName}</h4>
            <span className="text-[10px] opacity-80">Đang hoạt động</span>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded transition">✕</button>
      </div>

      {/* Body: Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {messages.map((msg, index) => {
          const isMe = Number(msg.sender_id) === Number(user.id);
          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] p-3 rounded-xl text-sm shadow-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                <p>{msg.content}</p>
                <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer: Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-sm"
        >
          ➤
        </button>
      </form>
    </div>
  );
}