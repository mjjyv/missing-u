// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Đảm bảo Backend bạn đang chạy ở port này
  headers: {
    // 'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào Header nếu có
axiosClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;