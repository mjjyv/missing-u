import { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';
import { jwtDecode } from 'jwt-decode'; // Import thư viện

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Giải mã token để lấy id và role
          const decoded = jwtDecode(token);
          // Gọi API profile để lấy thông tin đầy đủ (Tùy chọn nhưng khuyến khích)
          const res = await axiosClient.get('/users/profile');
          setUser(res.data.data); // res.data.data đã có id, email, full_name từ Backend
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      
      // LƯU ĐẦY ĐỦ DATA (BAO GỒM ID) VÀO STATE
      setUser(res.data.data); 
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Lỗi đăng nhập' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);