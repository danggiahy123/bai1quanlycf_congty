const http = require('http');

function testWebAdminConnection(host, port) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      resolve({
        success: true,
        status: res.statusCode
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

async function testWebAdmin() {
  console.log('🌐 Testing WebAdmin connection...');
  console.log('=' .repeat(50));

  // Test common Vite dev server ports
  const ports = [5173, 5174, 3000, 8080];
  
  for (const port of ports) {
    console.log(`\nTesting WebAdmin on port ${port}...`);
    
    // Test localhost
    const localhostResult = await testWebAdminConnection('localhost', port);
    if (localhostResult.success) {
      console.log(`✅ localhost:${port} - WebAdmin is running (Status: ${localhostResult.status})`);
    } else {
      console.log(`❌ localhost:${port} - Connection failed: ${localhostResult.error}`);
    }

    // Test new IP
    const ipResult = await testWebAdminConnection('192.168.1.161', port);
    if (ipResult.success) {
      console.log(`✅ 192.168.1.161:${port} - WebAdmin is running (Status: ${ipResult.status})`);
    } else {
      console.log(`❌ 192.168.1.161:${port} - Connection failed: ${ipResult.error}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 WebAdmin connection test completed');
}

testWebAdmin().catch(console.error);
