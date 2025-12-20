import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center px-8">
      <Link to="/" className="text-2xl font-bold text-black italic">MissingU</Link>
      <div className="space-x-6 flex items-center">
        <Link to="/" className="hover:text-black">Trang chủ</Link>
        {user ? (
          <>
            <span className="text-gray-700 font-medium italic">Chào, {user.email}</span>
            <Link to="/profile" className="hover:text-primary transition font-medium">Hồ sơ</Link>
            <button onClick={logout} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-black font-bold">Đăng nhập</Link>
            <Link to="/register" className="px-4 py-2 bg-black text-white rounded-lg font-bold">Đăng ký</Link>
          </>
        )}
      </div>
    </nav>
  );
}