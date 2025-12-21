import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
            MissingU
          </div>
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className="text-gray-700 font-medium hover:text-blue-600 transition"
          >
            Trang chủ
          </Link>

          {user ? (
            <>
              <Link 
                to="/explore" 
                className="font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Khám phá
              </Link>
              <Link 
                to="/post-item" 
                className="font-medium text-gray-700 hover:text-gray-900 transition"
              >
                Đăng bài
              </Link>
              <Link 
                to="/profile" 
                className="font-medium text-gray-700 hover:text-gray-900 transition"
              >
                Hồ sơ
              </Link>

              <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                <span className="text-sm text-gray-600 italic">
                  Xin chào, <span className="font-semibold text-blue-600">{user.full_name}</span>
                </span>
                <button
                  onClick={logout}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition shadow-md"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register"
                className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button (nếu cần mở rộng sau) */}
        <button className="md:hidden text-gray-700 text-2xl">☰</button>
      </div>
    </nav>
  );
}