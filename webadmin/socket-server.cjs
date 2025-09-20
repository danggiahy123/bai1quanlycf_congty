const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create HTTP server
const server = http.createServer();

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Mock data
const mockStats = {
  totalOrders: 1247,
  totalRevenue: 45678900,
  totalCustomers: 342,
  totalMenuItems: 28,
  availableTables: 12
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Handle room joining
  socket.on('join_room', (data) => {
    const { userType, userId } = data;
    const roomName = `${userType}_${userId}`;
    socket.join(roomName);
    console.log(`👤 User joined room: ${roomName}`);
    
    // Send welcome message
    socket.emit('welcome', {
      message: `Welcome to ${roomName}`,
      userType,
      userId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });

  // Send periodic updates (every 30 seconds)
  const interval = setInterval(() => {
    socket.emit('stats_update', {
      ...mockStats,
      timestamp: new Date().toISOString()
    });
  }, 30000);

  // Clean up interval on disconnect
  socket.on('disconnect', () => {
    clearInterval(interval);
  });
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log('🚀 Socket.IO Server running on http://localhost:3001');
  console.log('🔌 Socket.IO ready for connections');
  console.log('📊 Dashboard API: http://localhost:3001/api/dashboard/stats');
  console.log('🍽️ Menu API: http://localhost:3001/api/menu');
});

// Handle API routes
server.on('request', (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes
  if (req.url === '/api/dashboard/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockStats));
  } else if (req.url === '/api/menu') {
    const mockMenu = [
      { _id: '1', name: 'Cà phê đen', price: 15000, available: true },
      { _id: '2', name: 'Cà phê sữa', price: 20000, available: true },
      { _id: '3', name: 'Trà sữa', price: 25000, available: true }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockMenu));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});
