import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import axiosClient from '../api/axiosClient';
import ItemCard from '../components/ItemCard';
import ItemDetailModal from '../components/ItemDetailModal';
import FilterSidebar from '../components/FilterSidebar';
import { lostIcon, foundIcon, highlightIcon } from '../utils/mapIcons';
import 'leaflet/dist/leaflet.css';

// Component flyTo khi chọn một item
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

  // Bộ lọc mở rộng
  const [filters, setFilters] = useState({
    type: '',
    category_id: '',
    fromDate: '',
    toDate: '',
    color: '',
    brand: '',
    status: 'PENDING',
  });

  // Ref để debounce fetch khi kéo bản đồ
  const debounceRef = useRef(null);

  // Hàm fetch dữ liệu (bounds + filters)
  const fetchItems = useCallback(async (currentBounds, currentFilters) => {
    if (!currentBounds) return;

    try {
      const params = {
        ...currentBounds,
        ...currentFilters,
      };

      const res = await axiosClient.get('/items/spatial', { params });
      setItems(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu không gian:', err);
    }
  }, []);

  // Xử lý khi bounds thay đổi (di chuyển bản đồ)
  const handleBoundsChange = (bounds) => {
    setMapBounds(bounds);

    // Clear timeout cũ
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce 500ms trước khi gọi API
    debounceRef.current = setTimeout(() => {
      fetchItems(bounds, filters);
    }, 500);
  };

  // Khi người dùng áp dụng bộ lọc từ sidebar
  const handleApplyFilter = () => {
    if (mapBounds) {
      fetchItems(mapBounds, filters);
    }
  };

  // Khi click vào item (card hoặc marker)
  const handleItemSelect = (item) => {
    const [lng, lat] = item.location.coordinates;
    setSelectedLocation([lat, lng]);
    setHoveredId(item.id);
    setDetailItem(item);

    // Scroll card vào giữa danh sách
    const element = document.getElementById(`item-${item.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Refresh danh sách (dùng sau khi xóa/sửa bài)
  const refreshData = () => {
    if (mapBounds) {
      fetchItems(mapBounds, filters);
    }
  };

  // === GIẢI PHÁP CHÍNH: FETCH LẦN ĐẦU KHI MOUNT ===
  useEffect(() => {
    // Tạo bounds mặc định quanh trung tâm Hà Nội (zoom ~13)
    const defaultCenter = { lat: 21.0285, lng: 105.8521 };
    const delta = 0.05; // ~5-6km mỗi bên

    const initialBounds = {
      minLat: defaultCenter.lat - delta,
      maxLat: defaultCenter.lat + delta,
      minLng: defaultCenter.lng - delta,
      maxLng: defaultCenter.lng + delta,
    };

    setMapBounds(initialBounds);
    fetchItems(initialBounds, filters);
  }, [fetchItems]); // Chỉ chạy 1 lần khi mount

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* Modal chi tiết */}
      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onUpdateList={refreshData}
      />

      {/* SIDEBAR BỘ LỌC - Chỉ hiện trên màn lớn (lg+) */}
      <div className="hidden lg:block w-64 h-full overflow-y-auto bg-white border-r shadow-md z-30">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          onApply={handleApplyFilter}
        />
      </div>

      {/* DANH SÁCH KẾT QUẢ */}
      <div className="w-full lg:w-1/3 xl:w-1/4 h-full overflow-y-auto bg-gray-50 p-4 border-r z-20">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            Kết quả tìm kiếm ({items.length})
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
            <p className="text-sm">
              Không tìm thấy kết quả nào trong khu vực này.
            </p>
            <p className="text-xs mt-2">
              Hãy thử di chuyển bản đồ hoặc thay đổi bộ lọc.
            </p>
          </div>
        )}
      </div>

      {/* BẢN ĐỒ - Chỉ hiện trên màn lớn */}
      <div className="hidden lg:block flex-1 h-full relative z-10">
        <MapContainer
          center={[21.0285, 105.8521]} // Trung tâm Hà Nội
          zoom={13}
          className="h-full w-full"
          // whenReady={(mapInstance) => {
          //   const map = mapInstance.target;
          //   const bounds = map.getBounds();
          //   handleBoundsChange({
          //     minLat: bounds.getSouth(),
          //     maxLat: bounds.getNorth(),
          //     minLng: bounds.getWest(),
          //     maxLng: bounds.getEast(),
          //   });
          // }}
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
                    <p
                      className={`font-bold text-sm ${
                        item.type === 'LOST' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
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