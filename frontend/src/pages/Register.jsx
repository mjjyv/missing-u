import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function Register() {
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/auth/register', formData);
      alert('Đăng ký thành công! Hãy đăng nhập.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi đăng ký');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-600 mb-8">Tạo tài khoản</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input 
            type="text" placeholder="Họ và tên" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-gray-text-gray-600 outline-none"
            onChange={(e) => setFormData({...formData, full_name: e.target.value})} required 
          />
          <input 
            type="email" placeholder="Email" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-gray-text-gray-600 outline-none"
            onChange={(e) => setFormData({...formData, email: e.target.value})} required 
          />
          <input 
            type="password" placeholder="Mật khẩu" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-gray-text-gray-600 outline-none"
            onChange={(e) => setFormData({...formData, password: e.target.value})} required 
          />
          <button type="submit" className="w-full py-3 text-white bg-gray-500 rounded-xl font-bold hover:bg-red-500 shadow-lg transition">
            Đăng ký ngay
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          Đã có tài khoản? <Link to="/login" className="text-secondary font-bold">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}