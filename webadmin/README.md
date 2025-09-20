# 🍃 Cafe Admin - Hệ thống quản lý quán cà phê

Hệ thống quản lý quán cà phê hiện đại với giao diện xanh lá, trắng, đen chuyên nghiệp và tích hợp MongoDB.

## ✨ Tính năng chính

- 🎨 **Giao diện hiện đại**: Color scheme xanh lá, trắng, đen chuyên nghiệp
- 📊 **Dashboard thông minh**: Thống kê real-time với animations mượt mà
- 🍽️ **Quản lý thực đơn**: CRUD đầy đủ cho món ăn và đồ uống
- 🪑 **Quản lý bàn**: Theo dõi trạng thái bàn real-time
- 👥 **Quản lý khách hàng**: Lưu trữ thông tin và lịch sử
- 💰 **Quản lý đơn hàng**: Xử lý đơn hàng và thanh toán
- 📦 **Quản lý kho**: Theo dõi tồn kho và nhập xuất
- 🌙 **Dark/Light mode**: Chuyển đổi theme linh hoạt
- 📱 **Responsive**: Tối ưu cho mọi thiết bị

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+
- MongoDB 4.4+
- npm hoặc yarn

### 1. Cài đặt dependencies
```bash
cd webadmin
npm install
```

### 2. Khởi động MongoDB
```bash
# Windows
mongod --dbpath ./data/db

# macOS/Linux
sudo systemctl start mongod
```

### 3. Chạy ứng dụng

#### Cách 1: Chạy riêng lẻ
```bash
# Terminal 1 - API Server
npm run server

# Terminal 2 - Frontend
npm run dev
```

#### Cách 2: Chạy đồng thời
```bash
npm run dev:full
```

#### Cách 3: Sử dụng script Windows
```bash
start-dev.bat
```

### 4. Truy cập ứng dụng
- **Frontend**: http://localhost:5173 (hoặc port khác nếu 5173 bận)
- **API**: http://localhost:3001
- **MongoDB**: mongodb://localhost:27017/cafe_admin

## 🏗️ Cấu trúc dự án

```
webadmin/
├── src/
│   ├── components/
│   │   ├── ui/                 # UI Components
│   │   ├── SimpleDashboard.tsx # Dashboard chính
│   │   └── Layout.tsx          # Layout chính
│   ├── services/
│   │   └── api.ts              # API service
│   └── App.tsx                 # App chính
├── server.js                   # API Server
├── tailwind.config.js          # Tailwind config
└── package.json
```

## 🎨 Color Scheme

### Light Mode
- **Primary**: Xanh lá (#22c55e)
- **Background**: Trắng (#ffffff)
- **Text**: Đen (#0f172a)
- **Accent**: Xanh lá nhạt (#dcfce7)

### Dark Mode
- **Primary**: Xanh lá (#22c55e)
- **Background**: Đen (#0f172a)
- **Text**: Trắng (#f8fafc)
- **Accent**: Xanh lá đậm (#14532d)

## 📊 API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Thống kê tổng quan
- `GET /api/dashboard/recent-activity` - Hoạt động gần đây
- `GET /api/dashboard/top-items` - Món bán chạy

### Menu
- `GET /api/menu` - Lấy danh sách món
- `POST /api/menu` - Thêm món mới
- `PUT /api/menu/:id` - Cập nhật món
- `DELETE /api/menu/:id` - Xóa món

### Tables
- `GET /api/tables` - Lấy danh sách bàn
- `POST /api/tables` - Thêm bàn mới

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới

### Customers
- `GET /api/customers` - Lấy danh sách khách hàng
- `POST /api/customers` - Thêm khách hàng mới

### Employees
- `GET /api/employees` - Lấy danh sách nhân viên
- `POST /api/employees` - Thêm nhân viên mới

## 🗄️ Database Schema

### Collections
- **menuitems**: Thông tin món ăn
- **tables**: Thông tin bàn
- **orders**: Đơn hàng
- **customers**: Khách hàng
- **employees**: Nhân viên

## 🛠️ Công nghệ sử dụng

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Framer Motion
- Heroicons
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- CORS

### Development
- Vite
- Concurrently

## 📱 Responsive Design

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎯 Tính năng sắp tới

- [ ] Real-time notifications
- [ ] Báo cáo chi tiết
- [ ] Quản lý nhân viên
- [ ] Tích hợp thanh toán
- [ ] Mobile app

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

---

**Cafe Admin** - Quản lý quán cà phê chuyên nghiệp với giao diện xanh lá hiện đại! 🍃☕
