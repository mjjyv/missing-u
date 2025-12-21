import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useParams, useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Component chọn màu trực quan
const ColorPicker = ({ value, onChange }) => {
  const colors = ['#000000', '#FFFFFF', '#808080', '#FF0000', '#0000FF', '#008000', '#FFFF00', '#A52A2A', '#FFC0CB', '#800080'];
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(c => (
        <div
          key={c}
          onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-transform ${
            value === c ? 'border-blue-500 scale-110 shadow-lg' : 'border-gray-300'
          }`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  );
};

// Component chọn vị trí trên bản đồ
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Danh mục
  const [categories, setCategories] = useState([]);
  const [level1, setLevel1] = useState([]);
  const [level2, setLevel2] = useState([]);

  // Trạng thái chọn danh mục
  const [selectedL1, setSelectedL1] = useState('');
  const [selectedL2, setSelectedL2] = useState('');
  const [dynamicSchema, setDynamicSchema] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    type: 'LOST',
    title: '',
    description: '',
    date: '',
    attributes: {},
    status: 'PENDING',
  });

  const [position, setPosition] = useState(null); // { lat, lng }

  // Quản lý ảnh
  const [selectedImages, setSelectedImages] = useState([]); // File mới
  const [previews, setPreviews] = useState([]); // URL preview (existing + new)
  const [existingImages, setExistingImages] = useState([]); // URL ảnh cũ từ server

  const [loading, setLoading] = useState(true);

  // Xử lý upload ảnh mới
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + previews.length > 5) {
      return alert('Chỉ được tải lên tối đa 5 ảnh');
    }

    setSelectedImages(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  // Xóa ảnh theo index trong previews
  const removeImage = (index) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);

    if (index < existingImages.length) {
      // Xóa ảnh cũ
      const newExisting = existingImages.filter((_, i) => i !== index);
      setExistingImages(newExisting);
    } else {
      // Xóa ảnh mới
      const adjustedIndex = index - existingImages.length;
      const newSelected = selectedImages.filter((_, i) => i !== adjustedIndex);
      setSelectedImages(newSelected);
    }
  };

  // Tải dữ liệu song song khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [catRes, itemRes] = await Promise.all([
          axiosClient.get('/items/categories'),
          axiosClient.get(`/items/${id}`)
        ]);

        const allCats = catRes.data.data;
        const item = itemRes.data.data;

        // Cập nhật danh mục
        setCategories(allCats);
        setLevel1(allCats.filter(c => c.parent_id === null));

        // Điền form
        setFormData({
          type: item.type || 'LOST',
          title: item.title || '',
          description: item.description || '',
          date: item.created_at ? new Date(item.created_at).toISOString().slice(0, 16) : '',
          attributes: item.attributes || {},
          status: item.status || 'PENDING',
        });

        // Ảnh hiện có
        if (item.images && item.images.length > 0) {
          setExistingImages(item.images);
          setPreviews(item.images);
        }

        // Vị trí
        if (item.location && item.location.coordinates) {
          setPosition({
            lat: item.location.coordinates[1],
            lng: item.location.coordinates[0],
          });
        }

        // Danh mục
        if (item.category_id) {
          setSelectedL2(item.category_id);
          const currentCat = allCats.find(c => c.id === item.category_id);
          if (currentCat) {
            setDynamicSchema(currentCat.attributes_schema || []);
            if (currentCat.parent_id) {
              setSelectedL1(currentCat.parent_id);
              setLevel2(allCats.filter(c => c.parent_id === currentCat.parent_id));
            }
          }
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
        alert('Không thể tải thông tin bài đăng!');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Xử lý chọn cấp 1
  const handleL1Change = (e) => {
    const parentId = parseInt(e.target.value);
    setSelectedL1(parentId);
    setSelectedL2('');
    setDynamicSchema([]);
    setLevel2(categories.filter(c => c.parent_id === parentId));
  };

  // Xử lý chọn cấp 2 → load schema động
  const handleL2Change = (e) => {
    const catId = parseInt(e.target.value);
    setSelectedL2(catId);
    const cat = categories.find(c => c.id === catId);
    setDynamicSchema(cat?.attributes_schema || []);
    setFormData(prev => ({ ...prev, attributes: {} })); // Reset attributes khi đổi category
  };

  // Cập nhật thuộc tính động
  const handleDynamicChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value }
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (previews.length === 0) {
      return alert('Vui lòng giữ ít nhất 1 ảnh!');
    }
    if (!selectedL2) {
      return alert('Vui lòng chọn danh mục chi tiết!');
    }

    const formDataPayload = new FormData();

    if (position) {
      formDataPayload.append('latitude', position.lat);
      formDataPayload.append('longitude', position.lng);
    }

    formDataPayload.append('type', formData.type);
    formDataPayload.append('title', formData.title);
    formDataPayload.append('category_id', selectedL2);
    formDataPayload.append('description', formData.description);
    formDataPayload.append('attributes', JSON.stringify(formData.attributes));
    formDataPayload.append('status', formData.status);
    if (formData.date) formDataPayload.append('date', formData.date);

    // Gửi danh sách ảnh cũ còn giữ lại
    formDataPayload.append('existing_images', JSON.stringify(existingImages));

    // Gửi ảnh mới
    selectedImages.forEach(file => {
      formDataPayload.append('images', file);
    });

    try {
      await axiosClient.put(`/items/${id}`, formDataPayload);
      alert('Cập nhật tin thành công!');
      navigate('/profile');
    } catch (err) {
      console.error('Lỗi cập nhật:', err.response?.data);
      alert('Lỗi: ' + (err.response?.data?.message || 'Không thể cập nhật'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Sửa Tin Đăng</h1>
      <p className="text-gray-500 text-center mb-8">
        Cập nhật chi tiết để hệ thống tìm kiếm chính xác hơn.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-gray-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">1</span>
            Thông tin cơ bản
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại tin</label>
              <select
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500 outline-none bg-white"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="LOST">🔴 Báo Mất Đồ</option>
                <option value="FOUND">🟢 Tôi Nhặt Được</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Thời gian</label>
              <input
                type="datetime-local"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái</label>
              <select
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500 outline-none bg-white"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="PENDING">Đang chờ</option>
                <option value="RESOLVED">Đã giải quyết</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề tin</label>
              <input
                type="text"
                placeholder="Ví dụ: Mất ví da màu nâu tại Quận 1..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
          </div>
        </section>

        {/* PHẦN 2: DANH MỤC & THUỘC TÍNH */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-gray-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">2</span>
            Chi tiết vật phẩm
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại đồ vật</label>
              <select
                className="w-full p-3 border rounded-lg bg-white"
                value={selectedL1}
                onChange={handleL1Change}
                required
              >
                <option value="">-- Chọn nhóm --</option>
                {level1.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Chi tiết</label>
              <select
                className="w-full p-3 border rounded-lg bg-white disabled:bg-gray-100"
                value={selectedL2}
                onChange={handleL2Change}
                disabled={!selectedL1}
                required
              >
                <option value="">-- Chọn chi tiết --</option>
                {level2.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Form động theo schema */}
          {dynamicSchema.length > 0 && (
            <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
              <h3 className="font-bold text-gray-600 mb-4 uppercase text-sm tracking-wide">
                Đặc điểm nhận dạng
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {dynamicSchema.map((field, idx) => (
                  <div key={idx} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {field.label}
                      {field.hidden && (
                        <span className="ml-2 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          🔒 Bảo mật
                        </span>
                      )}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition"
                        value={formData.attributes[field.key] || ''}
                        onChange={e => handleDynamicChange(field.key, e.target.value)}
                      >
                        <option value="">Chọn {field.label}...</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'color' ? (
                      <ColorPicker
                        value={formData.attributes[field.key]}
                        onChange={val => handleDynamicChange(field.key, val)}
                      />
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        placeholder={field.hidden ? 'Thông tin này sẽ bị ẩn với người xem công khai' : `Nhập ${field.label}...`}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                        value={formData.attributes[field.key] || ''}
                        onChange={e => handleDynamicChange(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* PHẦN 3: VỊ TRÍ & MÔ TẢ */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-gray-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">3</span>
            Vị trí & Mô tả
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả thêm</label>
            <textarea
              className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-gray-500 outline-none resize-none"
              placeholder="Mô tả thêm về hoàn cảnh mất/nhặt được, đặc điểm khác..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="h-80 rounded-xl overflow-hidden border-2 border-gray-300 relative">
            <MapContainer
              center={position || [21.0285, 105.8521]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>

            {!position && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                <span className="bg-white px-4 py-2 rounded-full shadow-lg text-sm font-bold text-gray-700 animate-bounce">
                  📍 Nhấn vào bản đồ để ghim vị trí
                </span>
              </div>
            )}
          </div>

          {position && (
            <p className="mt-2 text-sm text-green-600 font-medium text-center">
              ✅ Đã chọn tọa độ: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          )}
        </section>

        {/* PHẦN 4: HÌNH ẢNH */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-gray-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">4</span>
            Hình ảnh vật phẩm
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {previews.length < 5 && (
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-100 transition bg-white">
                <span className="text-3xl text-gray-400">+</span>
                <span className="text-xs text-gray-500 mt-1">Thêm ảnh</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}

            {previews.map((url, index) => (
              <div key={index} className="relative h-24 group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg shadow"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3 italic">
            * Tối đa 5 ảnh. Ảnh đầu tiên sẽ là ảnh đại diện.
          </p>
        </section>

        {/* NÚT SUBMIT */}
        <button
          type="submit"
          className="w-full py-4 bg-gray-700 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-gray-800 transition transform hover:scale-[1.01] active:scale-[0.99]"
        >
          LƯU THAY ĐỔI 🚀
        </button>
      </form>
    </div>
  );
}