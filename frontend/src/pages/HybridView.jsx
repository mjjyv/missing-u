import { useState, useEffect,useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import axiosClient from '../api/axiosClient';
import ItemCard from '../components/ItemCard';
import ItemDetailModal from '../components/ItemDetailModal';
import { lostIcon, foundIcon, highlightIcon } from '../utils/mapIcons';

function MapFlyTo({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 16); }, [position, map]);
  return null;
}

// Component con xử lý sự kiện di chuyển bản đồ
function MapEvents({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    },
  });
  return null;
}

export default function HybridView() {
  const [items, setItems] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [detailItem, setDetailItem] = useState(null); // State quản lý Modal

  const [filters, setFilters] = useState({ type: '', category_id: '' });

  useEffect(() => {
    axiosClient.get('/items').then(res => setItems(res.data.data.filter(i => i.location)));
  }, []);


  // Hàm gọi API lấy dữ liệu theo vùng nhìn
  const fetchItemsInBounds = useCallback(async (bounds) => {
    try {
      const params = { ...bounds, ...filters };
      const res = await axiosClient.get('/items/spatial', { params });
      setItems(res.data.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu không gian:", err);
    }
  }, [filters]);

  const handleItemSelect = (item) => {
    const [lng, lat] = item.location.coordinates;
    setSelectedLocation([lat, lng]);
    setHoveredId(item.id);
    const element = document.getElementById(`item-${item.id}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // 1. Tạo hàm refresh data
  const refreshData = async () => {
      const res = await axiosClient.get('/items'); // Hoặc gọi API filter hiện tại
      setItems(res.data.data.filter(i => i.location));
  };

  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* Modal hiển thị khi detailItem có giá trị */}
      <ItemDetailModal item={detailItem} onClose={() => setDetailItem(null)} />

      {/* CỘT TRÁI: DANH SÁCH */}
      <div className="w-full md:w-1/3 h-full overflow-y-auto bg-gray-50 p-4 border-r">
        <h2 className="text-lg font-bold mb-4 px-2">KẾT QUẢ TÌM KIẾM ({items.length})</h2>

        <div className="flex gap-2 mt-2">
                <select 
                    className="text-xs p-1 border rounded"
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                    <option value="">Tất cả loại</option>
                    <option value="LOST">Tin mất</option>
                    <option value="FOUND">Nhặt được</option>
                </select>
            </div>
        {items.map(item => (
          <ItemCard 
            key={item.id} 
            item={item} 
            isHovered={hoveredId === item.id}
            onHover={setHoveredId}
            onClick={(it) => { handleItemSelect(it); setDetailItem(it); }} // Mở modal khi click card
          />
        ))}
      </div>

      {/* CỘT PHẢI: BẢN ĐỒ */}
      <div className="hidden md:block w-2/3 h-full">
        <MapContainer
          center={[21.0285, 105.8521]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="h-full w-full"
            whenReady={(mapInstance) => {
                // Lấy dữ liệu lần đầu khi bản đồ sẵn sàng
                const bounds = mapInstance.target.getBounds();
                fetchItemsInBounds({
                    minLat: bounds.getSouth(),
                    maxLat: bounds.getNorth(),
                    minLng: bounds.getWest(),
                    maxLng: bounds.getEast(),
                });
            }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFlyTo position={selectedLocation} />
          <MapEvents onBoundsChange={fetchItemsInBounds} />

          {/* // 2. Truyền vào Modal */}
          <ItemDetailModal 
              item={detailItem} 
              onClose={() => setDetailItem(null)} 
              onUpdateList={refreshData} // <-- QUAN TRỌNG
          />

          {items.map(item => {
            const position = [item.location.coordinates[1], item.location.coordinates[0]];
            const isHovered = hoveredId === item.id;
            return (
              <Marker 
                key={item.id} position={position}
                icon={isHovered ? highlightIcon : (item.type === 'LOST' ? lostIcon : foundIcon)}
                eventHandlers={{
                  click: () => handleItemSelect(item),
                  mouseover: () => setHoveredId(item.id),
                  mouseout: () => setHoveredId(null)
                }}
              >
                <Popup>
                  <div className="p-1">
                    <img src={item.images?.[0]} className="w-full h-20 object-cover rounded mb-2" alt="" />
                    <p className="font-bold text-xs mb-2 uppercase">{item.title}</p>
                    <button 
                      onClick={() => setDetailItem(item)} // Mở modal từ bản đồ
                      className="w-full bg-gray-500 text-white text-[10px] py-1.5 rounded font-bold"
                    >
                      XEM CHI TIẾT
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}