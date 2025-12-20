// frontend/src/App.jsx (Cập nhật)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar /> {/* Luôn hiển thị Navbar */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <h1 className="text-center mt-20 text-2xl">Trang quản lý cá nhân (Dashboard)</h1>
            </ProtectedRoute>
          } />
          <Route path="/" element={<h1 className="text-center mt-20 text-4xl font-bold">Hệ thống Tìm kiếm Đồ thất lạc</h1>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;