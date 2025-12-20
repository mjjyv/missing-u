import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Component chọn màu sắc trực quan (Thay vì nhập text) 
const ColorPicker = ({ value, onChange }) => {
  const colors = ['#000000', '#FFFFFF', '#808080', '#FF0000', '#0000FF', '#008000', '#FFFF00', '#A52A2A', '#FFC0CB', '#800080'];
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(c => (
        <div 
          key={c}
          onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full cursor-pointer border-2 ${value === c ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
      {/* Tùy chọn màu khác nếu cần */}
    </div>
  );
};

// Component con để chọn vị trí trên bản đồ
function LocationMarker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition(e.latlng); } });
  return position === null ? null : <Marker position={position}></Marker>;
}

export default function PostItem() {
  const navigate = useNavigate();
  
  // Dữ liệu danh mục
  const [categories, setCategories] = useState([]);
  const [level1, setLevel1] = useState([]); // Danh mục Cha
  const [level2, setLevel2] = useState([]); // Danh mục Con
  
  // Trạng thái chọn
  const [selectedL1, setSelectedL1] = useState('');
  const [selectedL2, setSelectedL2] = useState('');
  const [dynamicSchema, setDynamicSchema] = useState([]);

  // Form Data
  const [formData, setFormData] = useState({
    type: 'LOST', 
    title: '', 
    description: '', 
    date: new Date().toISOString().slice(0, 16), // Mặc định giờ hiện tại
    attributes: {}
  });
  const [position, setPosition] = useState(null);

  const [selectedImages, setSelectedImages] = useState([]); // Lưu file để upload
  const [previews, setPreviews] = useState([]); // Lưu URL tạm để hiển thị giao diện

  const handleImageChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length + selectedImages.length > 5) {
          return alert("Chỉ được tải lên tối đa 5 ảnh ");
      }

      setSelectedImages([...selectedImages, ...files]);

      // Tạo URL preview cho các ảnh mới chọn
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index) => {
      const newImages = [...selectedImages];
      const newPreviews = [...previews];
      newImages.splice(index, 1);
      newPreviews.splice(index, 1);
      setSelectedImages(newImages);
      setPreviews(newPreviews);
  };

  // 1. Lấy danh mục khi load trang
  useEffect(() => {
    axiosClient.get('/items/categories').then(res => {
      const allCats = res.data.data;
      setCategories(allCats);
      // Lọc cấp 1 (parent_id là null)
      setLevel1(allCats.filter(c => c.parent_id === null));
    });
  }, []);

  // 2. Xử lý khi chọn Cấp 1 -> Lọc ra Cấp 2
  const handleL1Change = (e) => {
    const parentId = parseInt(e.target.value);
    setSelectedL1(parentId);
    setSelectedL2(''); // Reset cấp 2
    setDynamicSchema([]); // Reset schema
    // Lọc danh mục con tương ứng
    setLevel2(categories.filter(c => c.parent_id === parentId));
  };

  // 3. Xử lý khi chọn Cấp 2 -> Load Schema Form Động 
  const handleL2Change = (e) => {
    const catId = parseInt(e.target.value);
    setSelectedL2(catId);
    const cat = categories.find(c => c.id === catId);
    // Parse JSON schema để render fields
    setDynamicSchema(cat?.attributes_schema || []);
    setFormData(prev => ({ ...prev, attributes: {} })); // Reset thuộc tính cũ
  };

  // 4. Xử lý nhập liệu động (Dynamic Input Handler)
  const handleDynamicChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value }
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedImages.length === 0) return alert("Vui lòng thêm ít nhất 1 ảnh!");

    const formDataPayload = new FormData();
    
    // Gắn các trường text
    formDataPayload.append('type', formData.type);
    formDataPayload.append('title', formData.title);
    formDataPayload.append('category_id', selectedL2);
    formDataPayload.append('description', formData.description);
    formDataPayload.append('latitude', position.lat);
    formDataPayload.append('longitude', position.lng);
    formDataPayload.append('attributes', JSON.stringify(formData.attributes));

    // QUAN TRỌNG: Lặp và append từng file vào cùng 1 key 'images'
    selectedImages.forEach((file) => {
        formDataPayload.append('images', file); 
    });

    try {
        await axiosClient.post('/items', formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Đăng tin thành công!');
        navigate('/explore');
    } catch (err) {
        console.error("Lỗi gửi tin:", err.response?.data);
        alert('Lỗi: ' + (err.response?.data?.message || "Không thể tải ảnh"));
    }
};
  

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-20">
      <h1 className="text-3xl font-bold text-primary mb-2 text-center">Đăng Tin Mới</h1>
      <p className="text-gray-500 text-center mb-8">Hãy cung cấp chi tiết để hệ thống tìm kiếm chính xác nhất.</p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* === PHẦN 1: THÔNG TIN CHUNG (GLOBAL FIELDS) === */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">1</span>
            Thông tin cơ bản
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại tin</label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="LOST">🔴 Báo Mất Đồ</option>
                <option value="FOUND">🟢 Tôi Nhặt Được</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Thời gian</label>
              <input 
                type="datetime-local"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề tin</label>
              <input 
                type="text" placeholder="Ví dụ: Mất ví da màu nâu tại Quận 1..." 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
          </div>
        </section>

        {/* === PHẦN 2: DANH MỤC & THUỘC TÍNH (CATEGORY SPECIFIC) ===  */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
             <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">2</span>
             Chi tiết vật phẩm
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Chọn Cấp 1 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại đồ vật</label>
              <select className="w-full p-3 border rounded-lg bg-white" onChange={handleL1Change} value={selectedL1} required>
                <option value="">-- Chọn nhóm --</option>
                {level1.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            {/* Chọn Cấp 2 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Chi tiết </label>
              <select 
                className="w-full p-3 border rounded-lg bg-white disabled:bg-gray-100" 
                onChange={handleL2Change} value={selectedL2} 
                disabled={!selectedL1} required
              >
                <option value="">-- Chọn chi tiết --</option>
                {level2.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          {/* Render Form Động dựa trên Schema 53] */}
          {dynamicSchema.length > 0 && (
            <div className="p-4 bg-white rounded-lg border border-primary/20 shadow-sm animate-fade-in-down">
              <h3 className="font-bold text-primary mb-4 uppercase text-sm tracking-wide">Đặc điểm nhận dạng</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {dynamicSchema.map((field, idx) => (
                  <div key={idx} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {field.label} 
                      {/* Hiển thị Icon khóa cho trường ẩn  */}
                      {field.hidden && <span className="ml-2 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">🔒 Bảo mật</span>}
                    </label>

                    {/* Logic Render Input dựa trên Type  */}
                    {field.type === 'select' ? (
                      <select 
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition"
                        onChange={(e) => handleDynamicChange(field.key, e.target.value)}
                      >
                        <option value="">Chọn {field.label}...</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.type === 'color' ? (
                       <ColorPicker onChange={(val) => handleDynamicChange(field.key, val)} value={formData.attributes[field.key]} />
                    ) : (
                      <input 
                        type={field.type === 'number' ? 'number' : 'text'} 
                        placeholder={field.hidden ? 'Thông tin này sẽ bị ẩn với người xem công khai' : `Nhập ${field.label}...`}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        onChange={(e) => handleDynamicChange(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">4</span>
        Hình ảnh vật phẩm
    </h2>
    
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Nút thêm ảnh */}
        {selectedImages.length < 5 && (
            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                <span className="text-2xl text-gray-400">+</span>
                <span className="text-xs text-gray-400">Thêm ảnh</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
        )}

        {/* Hiển thị Preview */}
        {previews.map((url, index) => (
            <div key={index} className="relative h-24 group">
                <img src={url} alt="preview" className="w-full h-full object-cover rounded-lg shadow" />
                <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                    ✕
                </button>
            </div>
        ))}
    </div>
    <p className="text-xs text-gray-400 mt-2 italic">* Tối đa 5 ảnh. Ảnh đầu tiên sẽ là ảnh đại diện của tin đăng.</p>
</section>

        

        {/* === PHẦN 3: VỊ TRÍ & MÔ TẢ === 11] */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
           <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
             <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">3</span>
             Vị trí & Hình ảnh
          </h2>

          <div className="mb-4">
             <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả thêm</label>
             <textarea 
               className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-primary outline-none"
               placeholder="Mô tả thêm về hoàn cảnh mất/nhặt được, đặc điểm khác..."
               value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
             ></textarea>
          </div>

          <div className="h-80 rounded-xl overflow-hidden border-2 border-gray-300 relative">
            <MapContainer center={[21.0285, 105.8521]} zoom={13} style={{ height: '100%', width: '100%' }}>
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
          {position && <p className="mt-2 text-sm text-green-600 font-medium text-center">✅ Đã chọn tọa độ: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>}
        </section>

        <button type="submit" className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl shadow-lg hover:bg-red-600 transition transform hover:scale-[1.01]">
          ĐĂNG TIN NGAY 🚀
        </button>
      </form>
    </div>
  );
}