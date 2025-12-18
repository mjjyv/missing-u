# missing-u

# 1. Tạo cấu trúc thư mục cho Backend
mkdir -p backend/src/{config,controllers,services,models,routes,middlewares,utils} \
         backend/tests \
         backend/migrations

# 2. Tạo các file cho Backend
touch backend/src/app.js \
      backend/src/server.js \
      backend/.env \
      backend/package.json

# 3. Tạo cấu trúc thư mục cho Frontend
mkdir -p frontend/public \
         frontend/src/{api,assets,components,hooks,pages,store,styles,utils} \
         frontend/src/features/{matching,posting,chat}

# 4. Tạo các file cho Frontend
touch frontend/src/App.js \
      frontend/src/main.jsx \
      frontend/.eslintrc.json \
      frontend/tailwind.config.js


mkdir -p: Tạo thư mục. Tham số -p (parents) giúp tạo các thư mục cha nếu chúng chưa tồn tại và không báo lỗi nếu thư mục đã có sẵn.

{a,b,c}: Đây là cú pháp "brace expansion" trong Linux, giúp tạo nhiều thư mục con cùng lúc trong một đường dẫn.

touch: Tạo một file trống tại đường dẫn chỉ định.


# Cài đặt công cụ tree để kiểm tra lại cấu trúc:
sudo apt install tree  # Nếu chưa có (Ubuntu/Debian)
tree -L 3              # Hiển thị cấu trúc thư mục ở 3 cấp độ


