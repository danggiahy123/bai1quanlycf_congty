// Simple test server without dependencies
const http = require('http');
const url = require('url');

const PORT = 3001;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Set content type
  res.setHeader('Content-Type', 'application/json');

  // Routes
  if (path === '/api/test') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      message: 'API Server is working!', 
      timestamp: new Date().toISOString() 
    }));
  } else if (path === '/api/dashboard/stats') {
    res.writeHead(200);
    res.end(JSON.stringify({
      totalOrders: 1247,
      totalRevenue: 45678900,
      totalCustomers: 342,
      totalMenuItems: 28,
      availableTables: 12
    }));
  } else if (path === '/api/menu') {
    res.writeHead(200);
    res.end(JSON.stringify([
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
    ]));
  } else if (path === '/api/dashboard/recent-activity') {
    res.writeHead(200);
    res.end(JSON.stringify([
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
    ]));
  } else if (path === '/api/dashboard/top-items') {
    res.writeHead(200);
    res.end(JSON.stringify([
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
    ]));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🍽️ Menu API: http://localhost:${PORT}/api/menu`);
});
