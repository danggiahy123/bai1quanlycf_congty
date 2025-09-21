const http = require('http');

const API_URL = 'http://192.168.1.161:5000';

function testConnection(host, port, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function testApiConnection() {
  console.log('🔍 Testing API connection to:', API_URL);
  console.log('=' .repeat(50));

  // Test 1: Health check
  console.log('1. Testing health check...');
  const healthResult = await testConnection('192.168.1.161', 5000, '/api/health');
  if (healthResult.success) {
    console.log('✅ Health check passed - Status:', healthResult.status);
    console.log('   Response:', healthResult.data);
  } else {
    console.log('❌ Health check failed:', healthResult.error);
  }

  // Test 2: Database debug
  console.log('\n2. Testing database connection...');
  const dbResult = await testConnection('192.168.1.161', 5000, '/api/debug/db');
  if (dbResult.success) {
    console.log('✅ Database connection passed - Status:', dbResult.status);
    console.log('   Response:', dbResult.data);
  } else {
    console.log('❌ Database connection failed:', dbResult.error);
  }

  // Test 3: Menu API
  console.log('\n3. Testing menu API...');
  const menuResult = await testConnection('192.168.1.161', 5000, '/api/menu');
  if (menuResult.success) {
    console.log('✅ Menu API passed - Status:', menuResult.status);
    try {
      const menuData = JSON.parse(menuResult.data);
      console.log('   Menu items count:', menuData.length);
    } catch (e) {
      console.log('   Response:', menuResult.data);
    }
  } else {
    console.log('❌ Menu API failed:', menuResult.error);
  }

  // Test 4: Tables API
  console.log('\n4. Testing tables API...');
  const tablesResult = await testConnection('192.168.1.161', 5000, '/api/tables');
  if (tablesResult.success) {
    console.log('✅ Tables API passed - Status:', tablesResult.status);
    try {
      const tablesData = JSON.parse(tablesResult.data);
      console.log('   Tables count:', tablesData.length);
    } catch (e) {
      console.log('   Response:', tablesResult.data);
    }
  } else {
    console.log('❌ Tables API failed:', tablesResult.error);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 API connection test completed');
}

// Test multiple IPs
async function testMultipleIPs() {
  const ips = [
    { host: '192.168.1.161', port: 5000 },
    { host: 'localhost', port: 5000 },
    { host: '127.0.0.1', port: 5000 }
  ];

  console.log('\n🌐 Testing multiple IP addresses...');
  console.log('-'.repeat(40));

  for (const ip of ips) {
    console.log(`\nTesting ${ip.host}:${ip.port}...`);
    const result = await testConnection(ip.host, ip.port, '/api/health');
    if (result.success) {
      console.log(`✅ ${ip.host}:${ip.port} - Server is running (Status: ${result.status})`);
    } else {
      console.log(`❌ ${ip.host}:${ip.port} - Connection failed: ${result.error}`);
    }
  }
}

// Run tests
testApiConnection()
  .then(() => testMultipleIPs())
  .catch(console.error);
