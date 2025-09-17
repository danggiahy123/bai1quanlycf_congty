# 🔌 Socket.IO Integration - Real-time Updates

## Tổng quan

Hệ thống đã được tích hợp Socket.IO để cung cấp cập nhật real-time cho:
- **Trạng thái bàn**: Cập nhật khi bàn được đặt/trả
- **Booking**: Cập nhật khi có đặt bàn mới/xác nhận/hủy
- **Order**: Cập nhật khi có đơn hàng mới/thanh toán
- **Payment**: Cập nhật khi có giao dịch thanh toán
- **Notifications**: Gửi thông báo real-time

## 🏗️ Kiến trúc

### Backend (Node.js + Express)
- **Socket.IO Server**: Chạy trên cùng port với Express server
- **Rooms**: Phân chia theo user type (customers, employees, admins)
- **Events**: Các event real-time được emit từ routes

### Frontend Mobile (React Native)
- **Socket Context**: Quản lý kết nối Socket.IO
- **Real-time Updates**: Cập nhật UI khi nhận được events
- **Connection Status**: Hiển thị trạng thái kết nối

### Web Admin (React)
- **Socket Hook**: Custom hook để quản lý Socket.IO
- **Toast Notifications**: Hiển thị thông báo real-time
- **Auto Refresh**: Tự động refresh data khi có thay đổi

## 📡 Socket Events

### Server Events (Emit từ Backend)

#### 1. Table Status Changed
```javascript
io.emit('table_status_changed', {
  tableId: 'table_123',
  tableName: 'Bàn 1',
  status: 'occupied' | 'empty',
  bookingId: 'booking_123',
  customerName: 'Nguyễn Văn A',
  timestamp: new Date()
});
```

#### 2. Booking Status Changed
```javascript
io.to('employees').emit('booking_status_changed', {
  bookingId: 'booking_123',
  tableId: 'table_123',
  customerId: 'customer_123',
  customerName: 'Nguyễn Văn A',
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  numberOfGuests: 4,
  bookingDate: '2024-01-15',
  bookingTime: '19:00',
  totalAmount: 500000,
  depositAmount: 100000,
  timestamp: new Date()
});
```

#### 3. Order Status Changed
```javascript
io.to('employees').emit('order_status_changed', {
  orderId: 'order_123',
  tableId: 'table_123',
  status: 'pending' | 'paid',
  items: [...],
  totalAmount: 300000,
  customerId: 'customer_123',
  customerName: 'Nguyễn Văn A',
  timestamp: new Date()
});
```

#### 4. Payment Status Changed
```javascript
io.emit('payment_status_changed', {
  orderId: 'order_123',
  tableId: 'table_123',
  tableName: 'Bàn 1',
  amount: 300000,
  status: 'completed' | 'failed' | 'cancelled',
  customerId: 'customer_123',
  customerName: 'Nguyễn Văn A',
  timestamp: new Date()
});
```

#### 5. New Notification
```javascript
io.to('customers').emit('new_notification', {
  userId: 'customer_123',
  title: 'Đặt bàn thành công',
  message: 'Bàn của bạn đã được xác nhận',
  type: 'booking_confirmed',
  bookingId: 'booking_123',
  timestamp: new Date()
});
```

### Client Events (Emit từ Frontend)

#### 1. Join Room
```javascript
socket.emit('join_room', {
  userType: 'customer' | 'employee' | 'admin',
  userId: 'user_123'
});
```

#### 2. Table Updated
```javascript
socket.emit('table_updated', {
  tableId: 'table_123',
  status: 'occupied',
  timestamp: new Date()
});
```

## 🚀 Cách sử dụng

### 1. Backend Setup
```bash
cd backend
npm install socket.io
npm start
```

### 2. Mobile App Setup
```bash
cd frontend/mobile
npm install socket.io-client
npm start
```

### 3. Web Admin Setup
```bash
cd webadmin
npm install socket.io-client
npm run dev
```

## 🔧 Cấu hình

### Environment Variables
```env
# Backend
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_management
JWT_SECRET=your-secret-key

# Frontend
VITE_API_URL=http://localhost:5000
DEFAULT_API_URL=http://localhost:5000
```

### Socket.IO Configuration
```javascript
// Backend
const io = new Server(server, {
  cors: {
    origin: true, // Cho phép tất cả origin
    credentials: true
  }
});

// Frontend
const socket = io(API_URL, {
  transports: ['websocket'],
  timeout: 20000,
});
```

## 📱 Mobile App Integration

### Socket Context
```typescript
import { useSocket } from '@/components/socket-context';

const { socket, isConnected } = useSocket();
```

### Real-time Updates
```typescript
useEffect(() => {
  if (!socket) return;

  const handleTableStatusChange = (data) => {
    // Cập nhật trạng thái bàn
    setTables(prevTables => 
      prevTables.map(table => 
        table.id === data.tableId 
          ? { ...table, status: data.status }
          : table
      )
    );
  };

  socket.on('table_status_changed', handleTableStatusChange);
  
  return () => {
    socket.off('table_status_changed', handleTableStatusChange);
  };
}, [socket]);
```

## 💻 Web Admin Integration

### Socket Hook
```typescript
import { useSocket } from './hooks/useSocket';

const { socket, isConnected } = useSocket();
```

### Real-time Notifications
```typescript
useEffect(() => {
  if (!socket) return;

  const handleTableStatusChange = (data) => {
    toast.success(`Bàn ${data.tableName} đã ${data.status === 'occupied' ? 'được đặt' : 'trống'}`);
    // Refresh data
    loadTables();
  };

  socket.on('table_status_changed', handleTableStatusChange);
  
  return () => {
    socket.off('table_status_changed', handleTableStatusChange);
  };
}, [socket]);
```

## 🧪 Testing

### Test Socket.IO Connection
```bash
cd backend
node test-socket.js
```

### Test Real-time Updates
1. Mở mobile app và web admin
2. Đặt bàn từ mobile app
3. Xem cập nhật real-time trên web admin
4. Xác nhận booking từ web admin
5. Xem cập nhật real-time trên mobile app

## 🔍 Debug

### Console Logs
- Backend: `🔌 Client connected`, `👤 User joined room`
- Frontend: `🔄 Table status changed`, `📅 Booking status changed`

### Connection Status
- Mobile: Hiển thị dot xanh/đỏ trong header
- Web Admin: Hiển thị status trong sidebar

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Kiểm tra CORS settings
   - Kiểm tra firewall/network
   - Kiểm tra port availability

2. **Events Not Received**
   - Kiểm tra room membership
   - Kiểm tra event names
   - Kiểm tra console logs

3. **Mobile App Issues**
   - Kiểm tra network permissions
   - Kiểm tra AsyncStorage
   - Kiểm tra user authentication

### Debug Commands
```bash
# Check server status
curl http://localhost:5000/api/health

# Check Socket.IO
curl http://localhost:5000/socket.io/

# Test connection
node backend/test-socket.js
```

## 📊 Performance

### Optimization
- Sử dụng rooms để giảm broadcast
- Debounce UI updates
- Cleanup event listeners
- Connection pooling

### Monitoring
- Socket connection count
- Event frequency
- Error rates
- Response times

## 🔒 Security

### Authentication
- JWT token validation
- User role verification
- Room access control

### Rate Limiting
- Event frequency limits
- Connection limits
- Message size limits

## 📈 Future Enhancements

1. **Presence System**: Hiển thị user online/offline
2. **Typing Indicators**: Hiển thị đang nhập
3. **File Sharing**: Chia sẻ file real-time
4. **Video Calls**: Gọi video trực tiếp
5. **Push Notifications**: Thông báo push khi offline

---

## ✅ Hoàn thành

- ✅ Backend Socket.IO server
- ✅ Mobile app integration
- ✅ Web admin integration
- ✅ Real-time table updates
- ✅ Real-time booking updates
- ✅ Real-time order updates
- ✅ Real-time payment updates
- ✅ Real-time notifications
- ✅ Connection status indicators
- ✅ Error handling
- ✅ Testing tools

Hệ thống Socket.IO đã được tích hợp hoàn chỉnh và sẵn sàng sử dụng! 🎉
