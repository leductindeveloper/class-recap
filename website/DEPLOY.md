# 🚀 Hướng Dẫn Deploy 11K Recap - Cho Cả Trường Xem

## Cách 1: Render.com (Miễn phí, dễ nhất)

### Bước 1: Tạo MongoDB Atlas (Database miễn phí)
1. Vào https://www.mongodb.com/atlas → Đăng ký miễn phí
2. Tạo Cluster miễn phí (M0)
3. **Database Access** → Add New User → Tạo user + password (ghi nhớ!)
4. **Network Access** → Add IP → Chọn **Allow Access from Anywhere** (0.0.0.0/0)
5. **Database** → Connect → **Connect your application** → Copy connection string
   - Thay `<password>` bằng mật khẩu user vừa tạo
   - Ví dụ: `mongodb+srv://admin:xxx@cluster0.xxxxx.mongodb.net/class_recap`

### Bước 2: Deploy lên Render
1. Đăng ký https://render.com (dùng GitHub)
2. **New** → **Web Service**
3. Kết nối repo GitHub của bạn (đẩy code website lên GitHub trước)
4. Cấu hình:
   - **Root Directory**: Để trống nếu package.json ở thư mục gốc, hoặc `website` nếu code nằm trong thư mục con
   - **Build Command**: `npm install` (file CSS đã build sẵn trong repo)
   - **Start Command**: `npm start`

5. **Environment Variables** - Thêm các biến:
   | Key | Value |
   |-----|-------|
   | MONGODB_URI | (connection string từ Atlas) |
   | SESSION_SECRET | (chuỗi ngẫu nhiên, ví dụ: `abc123xyz789`) |
   | ADMIN_USERNAME | admin |
   | ADMIN_PASSWORD | (mật khẩu admin - đổi khác mặc định!) |

6. **Create Web Service** → Chờ deploy (3-5 phút)
7. Truy cập: `https://11k-recap.onrender.com` (hoặc URL Render cấp)

### Lưu ý Render miễn phí:
- Sau 15 phút không có người dùng, server sẽ "sleep"
- Lần truy cập đầu sau khi sleep có thể mất 30-60 giây để thức dậy
- Có thể chia sẻ link cho toàn trường!

---

## Cách 2: Railway.app (Miễn phí $5/tháng)

1. Đăng ký https://railway.app
2. **New Project** → **Deploy from GitHub**
3. Chọn repo → Thêm biến môi trường giống trên
4. Railway tự nhận Node.js, deploy xong có URL ngay

---

## Cách 3: Chạy trên máy tính trường (Mạng nội bộ)

Nếu muốn chạy trên 1 máy trong phòng máy trường để mọi máy khác truy cập:

1. Cài Node.js + MongoDB (hoặc dùng MongoDB Atlas)
2. Sửa `.env`:
   ```
   MONGODB_URI=mongodb+srv://...
   PORT=3000
   ```
3. Chạy: `npm start`
4. Lấy IP máy (ví dụ: 192.168.1.100)
5. Máy khác truy cập: `http://192.168.1.100:3000`

---

## Đăng nhập Admin sau khi deploy

- URL: `https://your-url.com/admin`
- Mặc định: username `admin`, password `admin`
- **QUAN TRỌNG**: Đổi mật khẩu ngay trong file .env (ADMIN_PASSWORD) trước khi deploy!

---

## Upload ảnh khi deploy

Khi deploy lên Render/Railway, ảnh upload sẽ **không lưu vĩnh viễn** (server reset mỗi lần deploy). Giải pháp:

1. **Dùng URL ảnh từ Internet**: Khi tạo bài viết, paste link ảnh (Unsplash, Imgur...)
2. **MongoDB Atlas + Cloudinary** (nâng cao): Lưu ảnh lên Cloudinary, lưu URL vào DB

Tạm thời có thể dùng ảnh từ Unsplash bằng cách paste link trực tiếp.
