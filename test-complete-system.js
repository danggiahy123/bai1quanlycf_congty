const http = require('http');

function testAPI(host, port, path) {
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
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            success: true,
            status: res.statusCode,
            data: data
          });
        }
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

async function testCompleteSystem() {
  console.log('🔍 Testing Complete System - IP 192.168.1.161');
  console.log('=' .repeat(60));

  // Test 1: Backend Health
  console.log('1. Testing Backend Health...');
  const healthResult = await testAPI('192.168.1.161', 5000, '/api/health');
  if (healthResult.success) {
    console.log('✅ Backend Health: OK');
    console.log('   Response:', healthResult.data);
  } else {
    console.log('❌ Backend Health: FAILED -', healthResult.error);
  }

  // Test 2: Dashboard Stats
  console.log('\n2. Testing Dashboard Stats...');
  const statsResult = await testAPI('192.168.1.161', 5000, '/api/dashboard/stats');
  if (statsResult.success) {
    console.log('✅ Dashboard Stats: OK');
    console.log('   Total Tables:', statsResult.data.totalTables);
    console.log('   Total Orders:', statsResult.data.totalOrders);
    console.log('   Total Revenue:', statsResult.data.totalRevenue);
    console.log('   Total Customers:', statsResult.data.totalCustomers);
  } else {
    console.log('❌ Dashboard Stats: FAILED -', statsResult.error);
  }

  // Test 3: Menu API
  console.log('\n3. Testing Menu API...');
  const menuResult = await testAPI('192.168.1.161', 5000, '/api/menu');
  if (menuResult.success) {
    console.log('✅ Menu API: OK');
    console.log('   Menu Items:', menuResult.data.data?.length || 'Unknown');
  } else {
    console.log('❌ Menu API: FAILED -', menuResult.error);
  }

  // Test 4: Tables API
  console.log('\n4. Testing Tables API...');
  const tablesResult = await testAPI('192.168.1.161', 5000, '/api/tables');
  if (tablesResult.success) {
    console.log('✅ Tables API: OK');
    console.log('   Tables Count:', Array.isArray(tablesResult.data) ? tablesResult.data.length : 'Unknown');
  } else {
    console.log('❌ Tables API: FAILED -', tablesResult.error);
  }

  // Test 5: WebAdmin
  console.log('\n5. Testing WebAdmin...');
  const webadminResult = await testAPI('192.168.1.161', 5174, '/');
  if (webadminResult.success) {
    console.log('✅ WebAdmin: OK');
    console.log('   Status:', webadminResult.status);
  } else {
    console.log('❌ WebAdmin: FAILED -', webadminResult.error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 System Test Summary:');
  console.log('   Backend API: http://192.168.1.161:5000');
  console.log('   WebAdmin: http://192.168.1.161:5174');
  console.log('   Mobile App: Configured for 192.168.1.161:5000');
  console.log('\n📝 Next Steps:');
  console.log('   1. Open WebAdmin: http://192.168.1.161:5174');
  console.log('   2. Refresh the page (F5)');
  console.log('   3. The red error banner should disappear');
  console.log('   4. Dashboard should show real data');
}

testCompleteSystem().catch(console.error);
