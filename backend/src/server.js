require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// Removed upload support to keep API simple (use external image URLs)

const menuRouter = require('./routes/menu');
const tableRouter = require('./routes/table');
const orderRouter = require('./routes/order');
const employeeRouter = require('./routes/employee');
const customerRouter = require('./routes/customer');
const bookingRouter = require('./routes/booking');
const notificationRouter = require('./routes/notification');
const tableHistoryRouter = require('./routes/tableHistory');
const paymentRouter = require('./routes/payment');

const app = express();

// Middlewares
app.use(cors({
  origin: true, // Cho phép tất cả origin
  credentials: true
}));
app.use(express.json());

// Serve static files (uploaded images)
// No static uploads; image field should be a URL

// Routes
app.use('/api/menu', menuRouter);
app.use('/api/tables', tableRouter);
app.use('/api/orders', orderRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/customers', customerRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/table-history', tableHistoryRouter);
app.use('/api/payment', paymentRouter);

// Removed /api/upload endpoint

// Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check - server is running with latest code');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test bookings route
app.get('/api/bookings-test', (req, res) => {
  res.json({ message: 'Bookings route test - server updated!' });
});

// Debug: xem thông tin kết nối MongoDB hiện tại
app.get('/api/debug/db', async (req, res) => {
  try {
    const conn = mongoose.connection;
    const collections = await conn.db.listCollections().toArray();
    res.json({
      host: conn.host,
      port: conn.port,
      name: conn.name,
      collections: collections.map(c => c.name),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DB connect and server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
    });
    console.log('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on http://0.0.0.0:${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = app;


