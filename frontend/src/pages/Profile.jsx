import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function Profile() {
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get('/users/profile');
      setProfile(res.data.data);
    } catch (err) { alert('Không thể lấy thông tin profile'); }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put('/users/update-profile', { full_name: profile.full_name });
      alert('Cập nhật thông tin thành công!');
    } catch (err) { alert('Lỗi cập nhật'); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return alert('Mật khẩu mới không khớp');
    try {
      await axiosClient.put('/users/change-password', passwords);
      alert('Đổi mật khẩu thành công!');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { alert(err.response?.data?.message || 'Lỗi đổi mật khẩu'); }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Cài đặt tài khoản</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form Cập nhật thông tin */}
        <section className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-500">Thông tin cá nhân</h2>
          <form onSubmit={handleUpdateInfo} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600">Email (Không thể thay đổi)</label>
              <input type="text" value={profile.email} disabled className="w-full p-2 bg-gray-100 border rounded mt-1" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Họ và tên</label>
              <input 
                type="text" 
                value={profile.full_name} 
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                className="w-full p-2 border rounded mt-1 outline-gray-500"
              />
            </div>
            <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-red-500 transition">Lưu thay đổi</button>
          </form>
        </section>

        {/* Form Đổi mật khẩu */}
        <section className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-600">Bảo mật</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input 
              type="password" placeholder="Mật khẩu hiện tại" 
              value={passwords.oldPassword} onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
              className="w-full p-2 border rounded outline-gray-600" required
            />
            <input 
              type="password" placeholder="Mật khẩu mới" 
              value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
              className="w-full p-2 border rounded outline-gray-600" required
            />
            <input 
              type="password" placeholder="Xác nhận mật khẩu mới" 
              value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
              className="w-full p-2 border rounded outline-gray-600" required
            />
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-teal-600 transition">Đổi mật khẩu</button>
          </form>
        </section>
      </div>
    </div>
  );
}