const axios = require('axios');

const API_URL = 'http://192.168.1.161:5000';

async function testApiConnection() {
  console.log('🔍 Testing API connection to:', API_URL);
  console.log('=' .repeat(50));

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  try {
    // Test 2: Database connection
    console.log('\n2. Testing database connection...');
    const dbResponse = await axios.get(`${API_URL}/api/debug/db`);
    console.log('✅ Database connection passed:', dbResponse.data);
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }

  try {
    // Test 3: Menu API
    console.log('\n3. Testing menu API...');
    const menuResponse = await axios.get(`${API_URL}/api/menu`);
    console.log('✅ Menu API passed - Items count:', menuResponse.data.length);
  } catch (error) {
    console.log('❌ Menu API failed:', error.message);
  }

  try {
    // Test 4: Tables API
    console.log('\n4. Testing tables API...');
    const tablesResponse = await axios.get(`${API_URL}/api/tables`);
    console.log('✅ Tables API passed - Tables count:', tablesResponse.data.length);
  } catch (error) {
    console.log('❌ Tables API failed:', error.message);
  }

  try {
    // Test 5: Dashboard stats
    console.log('\n5. Testing dashboard stats...');
    const dashboardResponse = await axios.get(`${API_URL}/api/dashboard/stats`);
    console.log('✅ Dashboard API passed:', dashboardResponse.data);
  } catch (error) {
    console.log('❌ Dashboard API failed:', error.message);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 API connection test completed');
}

// Test with different IP addresses
async function testMultipleIPs() {
  const ips = [
    '192.168.1.161',
    'localhost',
    '127.0.0.1'
  ];

  for (const ip of ips) {
    console.log(`\n🌐 Testing IP: ${ip}`);
    console.log('-'.repeat(30));
    
    try {
      const response = await axios.get(`http://${ip}:5000/api/health`, { timeout: 5000 });
      console.log(`✅ ${ip}:5000 - Server is running`);
    } catch (error) {
      console.log(`❌ ${ip}:5000 - Connection failed: ${error.message}`);
    }
  }
}

// Run tests
testApiConnection()
  .then(() => testMultipleIPs())
  .catch(console.error);
