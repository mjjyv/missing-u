export default function DynamicField({ field, value, onChange }) {
  // Render bộ chọn màu sắc trực quan 
  if (field.type === 'color') {
    const colors = [
      { name: 'Đen', code: '#000000' }, { name: 'Trắng', code: '#FFFFFF' },
      { name: 'Đỏ', code: '#FF0000' }, { name: 'Nâu', code: '#8B4513' },
      { name: 'Vàng', code: '#FFD700' }, { name: 'Xanh', code: '#0000FF' }
    ];
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{field.label}</label>
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button
              key={c.name} type="button"
              onClick={() => onChange(field.key, c.name)}
              className={`w-8 h-8 rounded-full border-2 ${value === c.name ? 'border-primary' : 'border-transparent'}`}
              style={{ backgroundColor: c.code }} title={c.name}
            />
          ))}
        </div>
      </div>
    );
  }

  // Render Dropdown hoặc Radio cho Nhãn hiệu/Giới tính 
  if (field.type === 'select') {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{field.label}</label>
        <select 
          className="w-full p-2 border rounded-lg outline-primary"
          value={value || ''} onChange={(e) => onChange(field.key, e.target.value)}
        >
          <option value="">-- Chọn {field.label} --</option>
          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  // Render ô nhập văn bản/số (bao gồm trường Ẩn/Kín) [cite: 15, 17, 19]
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        {field.label} {field.hidden && <span className="text-xs text-red-500">(Bảo mật)</span>}
      </label>
      <input 
        type={field.type === 'number' ? 'number' : 'text'}
        placeholder={field.hidden ? "Chỉ hệ thống thấy để đối soát" : field.label}
        className="w-full p-2 border rounded-lg outline-primary"
        value={value || ''} onChange={(e) => onChange(field.key, e.target.value)}
      />
    </div>
  );
}