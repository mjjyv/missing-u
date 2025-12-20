// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra đăng nhập khi vừa vào trang (F5 không bị mất login)
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Ở đây tạm thời ta set user = true, 
        // Giai đoạn sau nên gọi API /profile để lấy info user thật
        setUser({ token }); 
      }
      setLoading(false);
    };
    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser({ email: res.data.data.email, role: res.data.data.role });
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


  // Thêm hàm update vào AuthContext
  const updateUserInfo = (newData) => {
      setUser(prev => ({ ...prev, ...newData }));
  };
};

export const useAuth = () => useContext(AuthContext);