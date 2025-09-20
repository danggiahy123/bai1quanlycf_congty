import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API Server is working!', timestamp: new Date().toISOString() });
});

// Dashboard stats (mock data)
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalOrders: 1247,
    totalRevenue: 45678900,
    totalCustomers: 342,
    totalMenuItems: 28,
    availableTables: 12
  });
});

// Menu items (mock data)
app.get('/api/menu', (req, res) => {
  res.json([
    {
      _id: '1',
      name: 'Cà phê đen',
      description: 'Cà phê đen nguyên chất',
      price: 15000,
      category: 'Đồ uống',
      status: 'available'
    },
    {
      _id: '2',
      name: 'Bánh mì sandwich',
      description: 'Bánh mì sandwich thịt nướng',
      price: 25000,
      category: 'Đồ ăn',
      status: 'available'
    }
  ]);
});

// Recent activity (mock data)
app.get('/api/dashboard/recent-activity', (req, res) => {
  res.json([
    {
      id: '1',
      type: 'order',
      message: 'Đơn hàng #1234 đã thanh toán',
      time: '2 phút trước',
      amount: 150000
    },
    {
      id: '2',
      type: 'customer',
      message: 'Khách hàng mới đăng ký',
      time: '5 phút trước'
    }
  ]);
});

// Top items (mock data)
app.get('/api/dashboard/top-items', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Cà phê đen',
      quantity: 45,
      revenue: 675000
    },
    {
      id: '2',
      name: 'Bánh mì sandwich',
      quantity: 32,
      revenue: 640000
    }
  ]);
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🍽️ Menu API: http://localhost:${PORT}/api/menu`);
});
