import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { lostIcon, foundIcon } from '../utils/mapIcons';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

// Component để di chuyển bản đồ khi chọn Item
function FlyToLocation({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 2 });
  }, [center, map]);
  return null;
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null); // Để map bay tới

  useEffect(() => {
    axiosClient.get('/items')
      .then(res => {
        setItems(res.data.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      
      {/* === CỘT TRÁI: DANH SÁCH TIN (SCROLLABLE) === */}
      <div className="w-1/3 min-w-[350px] bg-gray-50 overflow-y-auto p-4 border-r shadow-xl z-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4 sticky top-0 bg-gray-50 py-2">
          Tin Mới Nhất ({items.length})
        </h2>
        
        {loading ? <p>Đang tải dữ liệu...</p> : (
          <div className="space-y-4">
            {items.map(item => (
              <div 
                key={item.id}
                // Sự kiện Hover: Bản đồ tự bay tới vị trí [cite: 45]
                onMouseEnter={() => setSelectedLocation([item.latitude, item.longitude])}
                className={`p-4 bg-white rounded-lg shadow-sm border-l-4 cursor-pointer transition transform hover:scale-[1.02] hover:shadow-md 
                  ${item.type === 'LOST' ? 'border-red-500' : 'border-green-500'}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-bold px-2 py-1 rounded text-white mb-2 inline-block
                    ${item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {item.type === 'LOST' ? 'BÁO MẤT' : 'NHẶT ĐƯỢC'}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg truncate">{item.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
                
                {/* Hiển thị thuộc tính nhanh */}
                <div className="mt-2 flex gap-2 flex-wrap">
                  {Object.entries(item.attributes).slice(0, 3).map(([key, val]) => (
                    <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === CỘT PHẢI: BẢN ĐỒ (FIXED) === */}
      <div className="w-2/3 h-full relative">
        <MapContainer center={[21.0285, 105.8521]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Component điều khiển hiệu ứng bay */}
          <FlyToLocation center={selectedLocation} />

          {/* Render các Markers */}
          {items.map(item => (
            item.latitude && item.longitude && (
              <Marker 
                key={item.id} 
                position={[item.latitude, item.longitude]}
                // Chọn icon dựa trên loại tin [cite: 41]
                icon={item.type === 'LOST' ? lostIcon : foundIcon}
              >
                <Popup>
                  <div className="w-48">
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 my-1 truncate">{item.description}</p>
                    <Link to={`/items/${item.id}`} className="block text-center text-xs bg-primary text-white py-1 rounded mt-2">
                      Xem chi tiết
                    </Link>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
        
        {/* Chú thích bản đồ */}
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-lg z-1000 text-xs">
          <div className="flex items-center mb-1"><span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span> Tin Báo Mất</div>
          <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span> Tin Nhặt Được</div>
        </div>
      </div>
    </div>
  );
}