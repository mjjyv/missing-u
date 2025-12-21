import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import axiosClient from '../api/axiosClient';
import ItemCard from '../components/ItemCard';
import ItemDetailModal from '../components/ItemDetailModal';
import FilterSidebar from '../components/FilterSidebar';
import { lostIcon, foundIcon, highlightIcon } from '../utils/mapIcons';
import 'leaflet/dist/leaflet.css';

// Component flyTo khi chọn item
function MapFlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16);
  }, [position, map]);
  return null;
}

// Component xử lý sự kiện bản đồ
function MapEvents({ onBoundsChange }) {
  const map = useMap();

  useMapEvents({
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
  const [detailItem, setDetailItem] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);

  const [filters, setFilters] = useState({
    type: '',
    category_id: '',
    fromDate: '',
    toDate: '',
    color: '',
    brand: '',
    status: 'PENDING',
  });

  // Trạng thái mở/đóng drawer lọc
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const debounceRef = useRef(null);

  const fetchItems = useCallback(async (currentBounds, currentFilters) => {
    if (!currentBounds) return;

    try {
      const params = { ...currentBounds, ...currentFilters };
      const res = await axiosClient.get('/items/spatial', { params });
      setItems(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu không gian:', err);
    }
  }, []);

  const handleBoundsChange = (bounds) => {
    setMapBounds(bounds);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchItems(bounds, filters);
    }, 500);
  };

  const handleApplyFilter = () => {
    if (mapBounds) {
      fetchItems(mapBounds, filters);
    }
    // Đóng drawer sau khi áp dụng (UX tốt trên mọi thiết bị)
    setIsFilterOpen(false);
  };

  const handleItemSelect = (item) => {
    const [lng, lat] = item.location.coordinates;
    setSelectedLocation([lat, lng]);
    setHoveredId(item.id);
    setDetailItem(item);

    const element = document.getElementById(`item-${item.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const refreshData = () => {
    if (mapBounds) fetchItems(mapBounds, filters);
  };

  // Fetch lần đầu khi mount (bounds mặc định quanh Hà Nội)
  useEffect(() => {
    const defaultCenter = { lat: 21.0285, lng: 105.8521 };
    const delta = 0.05;

    const initialBounds = {
      minLat: defaultCenter.lat - delta,
      maxLat: defaultCenter.lat + delta,
      minLng: defaultCenter.lng - delta,
      maxLng: defaultCenter.lng + delta,
    };

    setMapBounds(initialBounds);
    fetchItems(initialBounds, filters);
  }, [fetchItems]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative h-[calc(100vh-64px)] flex flex-col lg:flex-row">
      {/* Modal chi tiết */}
      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onUpdateList={refreshData}
      />

      {/* Overlay tối khi drawer mở (chủ yếu cho mobile) */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsFilterOpen(false)}
        />
      )}

      {/* Drawer lọc - trượt từ trái */}
      <div
        className={`fixed top-16 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto
          ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
       

          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilter}
          />
        </div>

      {/* NÚT FLOATING MỞ DRAWER - HIỆN LUÔN TRÊN MỌI THIẾT BỊ */}
      <button
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="fixed bottom-6 left-6 z-50
                   w-14 h-14 bg-gray-500 text-white rounded-full shadow-2xl
                   flex items-center justify-center text-2xl font-bold
                   hover:bg-red-600 transition transform active:scale-95
                   ring-4 ring-white"
      >
        {isFilterOpen ? '✕' : '⚡'}
      </button>

      {/* DANH SÁCH KẾT QUẢ */}
      <div className="w-full lg:w-2/5 xl:w-1/4 h-1/2 lg:h-full overflow-y-auto bg-gray-50 p-4 border-b lg:border-b-0 lg:border-r z-20">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            Kết quả ({items.length})
          </h2>
        </div>

        {items.length > 0 ? (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isHovered={hoveredId === item.id}
              onHover={setHoveredId}
              onClick={() => handleItemSelect(item)}
            />
          ))
        ) : (
          <div className="text-center mt-20 text-gray-400">
            <p className="text-sm">Đang tải dữ liệu khu vực...</p>
            <p className="text-xs mt-2">Di chuyển bản đồ để xem thêm</p>
          </div>
        )}
      </div>

      {/* BẢN ĐỒ */}
      <div className="flex-1 h-1/2 lg:h-full relative z-10">
        <MapContainer
          center={[21.0285, 105.8521]}
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFlyTo position={selectedLocation} />
          <MapEvents onBoundsChange={handleBoundsChange} />

          {items.map((item) => {
            const position = [item.location.coordinates[1], item.location.coordinates[0]];
            const isHovered = hoveredId === item.id;

            return (
              <Marker
                key={item.id}
                position={position}
                icon={isHovered ? highlightIcon : (item.type === 'LOST' ? lostIcon : foundIcon)}
                eventHandlers={{
                  click: () => handleItemSelect(item),
                  mouseover: () => setHoveredId(item.id),
                  mouseout: () => setHoveredId(null),
                }}
              >
                <Popup>
                  <div className="text-center py-1 px-2 min-w-32">
                    <p className={`font-bold text-sm ${item.type === 'LOST' ? 'text-red-600' : 'text-green-600'}`}>
                      {item.title}
                    </p>
                    <button
                      onClick={() => setDetailItem(item)}
                      className="mt-2 w-full bg-blue-500 text-white text-xs py-1.5 rounded font-medium hover:bg-blue-600"
                    >
                      Xem chi tiết
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