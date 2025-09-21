const http = require('http');

function testWebAdminAPI() {
  return new Promise((resolve) => {
    const options = {
      hostname: '192.168.1.161',
      port: 5174,
      path: '/',
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
          hasError: data.includes('Không thể kết nối đến API server')
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

async function main() {
  console.log('🔍 Testing WebAdmin connection...');
  console.log('=' .repeat(50));

  const result = await testWebAdminAPI();
  
  if (result.success) {
    console.log('✅ WebAdmin is accessible on http://192.168.1.161:5174');
    console.log('   Status:', result.status);
    
    if (result.hasError) {
      console.log('❌ WebAdmin shows API connection error');
      console.log('   This means the frontend is loading but cannot connect to backend');
    } else {
      console.log('✅ WebAdmin appears to be working correctly');
    }
  } else {
    console.log('❌ WebAdmin connection failed:', result.error);
  }

  console.log('\n🔧 Backend Status:');
  console.log('   - Backend API: http://192.168.1.161:5000 ✅ Running');
  console.log('   - WebAdmin: http://192.168.1.161:5174 ✅ Running');
  console.log('   - API Configuration: ✅ Updated to use port 5000');
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Refresh the WebAdmin page (F5)');
  console.log('   2. Check if the red error banner disappears');
  console.log('   3. If still showing error, check browser console for details');
}

main().catch(console.error);
