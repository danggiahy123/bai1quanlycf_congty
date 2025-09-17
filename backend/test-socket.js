const { io } = require('socket.io-client');

// Test Socket.IO connection
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('🔌 Test client connected:', socket.id);
  
  // Join as admin
  socket.emit('join_room', {
    userType: 'admin',
    userId: 'test_admin_123'
  });
  
  console.log('👤 Test admin joined room');
});

socket.on('disconnect', () => {
  console.log('🔌 Test client disconnected');
});

socket.on('connect_error', (error) => {
  console.error('❌ Test client connection error:', error);
});

// Listen for real-time events
socket.on('table_status_changed', (data) => {
  console.log('🔄 Table status changed:', data);
});

socket.on('booking_status_changed', (data) => {
  console.log('📅 Booking status changed:', data);
});

socket.on('order_status_changed', (data) => {
  console.log('🛒 Order status changed:', data);
});

socket.on('payment_status_changed', (data) => {
  console.log('💳 Payment status changed:', data);
});

socket.on('new_notification', (data) => {
  console.log('🔔 New notification:', data);
});

// Test emitting events
setTimeout(() => {
  console.log('🧪 Testing Socket.IO events...');
  
  // Test table update
  socket.emit('table_updated', {
    tableId: 'test_table_1',
    tableName: 'Bàn Test',
    status: 'occupied',
    timestamp: new Date()
  });
  
  // Test booking update
  socket.emit('booking_updated', {
    bookingId: 'test_booking_1',
    tableId: 'test_table_1',
    customerId: 'test_customer_1',
    status: 'confirmed',
    timestamp: new Date()
  });
  
  // Test order update
  socket.emit('order_updated', {
    orderId: 'test_order_1',
    tableId: 'test_table_1',
    status: 'pending',
    timestamp: new Date()
  });
  
  // Test payment update
  socket.emit('payment_updated', {
    orderId: 'test_order_1',
    tableId: 'test_table_1',
    amount: 150000,
    status: 'completed',
    timestamp: new Date()
  });
  
  // Test notification
  socket.emit('notification_sent', {
    userId: 'test_customer_1',
    title: 'Test Notification',
    message: 'This is a test notification',
    timestamp: new Date()
  });
  
  console.log('✅ All test events emitted');
}, 2000);

// Keep connection alive for testing
setTimeout(() => {
  console.log('🔌 Test completed, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);
