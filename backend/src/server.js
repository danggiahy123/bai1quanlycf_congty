require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
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
const ingredientsRouter = require('./routes/ingredients');
const importOrdersRouter = require('./routes/importOrders');
const exportOrdersRouter = require('./routes/exportOrders');
const inventoryTransactionsRouter = require('./routes/inventoryTransactions');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: true, // Cho phép tất cả origin
    credentials: true
  }
});

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
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/import-orders', importOrdersRouter);
app.use('/api/export-orders', exportOrdersRouter);
app.use('/api/inventory-transactions', inventoryTransactionsRouter);
app.use('/api/dashboard', dashboardRouter);

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join user to specific rooms based on their role
  socket.on('join_room', (data) => {
    const { userType, userId } = data;
    if (userType === 'customer') {
      socket.join(`customer_${userId}`);
      socket.join('customers');
    } else if (userType === 'employee') {
      socket.join('employees');
      socket.join(`employee_${userId}`);
    } else if (userType === 'admin') {
      socket.join('admins');
      socket.join('employees'); // Admin cũng là employee
    }
    console.log(`👤 User ${userId} (${userType}) joined room`);
  });

  // Handle table updates
  socket.on('table_updated', (data) => {
    console.log('🔄 Table updated:', data);
    // Broadcast to all connected clients
    io.emit('table_status_changed', data);
  });

  // Handle booking updates
  socket.on('booking_updated', (data) => {
    console.log('📅 Booking updated:', data);
    // Broadcast to relevant rooms
    io.to('employees').emit('booking_status_changed', data);
    if (data.customerId) {
      io.to(`customer_${data.customerId}`).emit('booking_status_changed', data);
    }
  });

  // Handle order updates
  socket.on('order_updated', (data) => {
    console.log('🛒 Order updated:', data);
    // Broadcast to employees and relevant customer
    io.to('employees').emit('order_status_changed', data);
    if (data.customerId) {
      io.to(`customer_${data.customerId}`).emit('order_status_changed', data);
    }
  });

  // Handle payment updates
  socket.on('payment_updated', (data) => {
    console.log('💳 Payment updated:', data);
    // Broadcast to employees and relevant customer
    io.to('employees').emit('payment_status_changed', data);
    if (data.customerId) {
      io.to(`customer_${data.customerId}`).emit('payment_status_changed', data);
    }
  });

  // Handle notification updates
  socket.on('notification_sent', (data) => {
    console.log('🔔 Notification sent:', data);
    // Send to specific user or broadcast
    if (data.userId) {
      io.to(`customer_${data.userId}`).emit('new_notification', data);
    } else {
      io.to('customers').emit('new_notification', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// DB connect and server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
    });
    console.log('Connected to MongoDB');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
      console.log(`🔌 Socket.IO server ready for real-time updates`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = { app, io };


