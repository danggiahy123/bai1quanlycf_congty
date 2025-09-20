const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Token admin hợp lệ
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzhlNWUxZDFiMzRhMjkxZjc1ZTkzOSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgzMzk1MTYsImV4cCI6MTc1ODQyNTkxNn0.PgPp_DqqNjGdDtuOZPbsEFLVq03A2rPIpKhtUST6L4g';

async function testRevenueAPI() {
  try {
    console.log('Testing Dashboard Revenue API...\n');

    // Test revenue endpoint
    console.log('1. Testing /api/dashboard/revenue...');
    try {
      const revenueResponse = await axios.get(`${API_BASE}/dashboard/revenue?range=day`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Revenue API Success');
      console.log('Revenue data:', revenueResponse.data);
      console.log(`Found ${revenueResponse.data.length} revenue records\n`);
    } catch (error) {
      console.log('❌ Revenue API Error:', error.response?.status, error.response?.data || error.message);
      console.log('This might be due to authentication. Let\'s test without auth...\n');
      
      // Test without auth
      try {
        const revenueResponse = await axios.get(`${API_BASE}/dashboard/revenue?range=day`);
        console.log('✅ Revenue API (no auth) Success');
        console.log('Revenue data:', revenueResponse.data);
      } catch (noAuthError) {
        console.log('❌ Revenue API (no auth) Error:', noAuthError.response?.status, noAuthError.response?.data || noAuthError.message);
      }
    }

    // Test stats endpoint
    console.log('\n2. Testing /api/dashboard/stats...');
    try {
      const statsResponse = await axios.get(`${API_BASE}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Stats API Success');
      console.log('Stats data:', statsResponse.data);
    } catch (error) {
      console.log('❌ Stats API Error:', error.response?.status, error.response?.data || error.message);
    }

    // Test top items endpoint
    console.log('\n3. Testing /api/dashboard/top-items...');
    try {
      const topItemsResponse = await axios.get(`${API_BASE}/dashboard/top-items`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Top Items API Success');
      console.log('Top items data:', topItemsResponse.data);
    } catch (error) {
      console.log('❌ Top Items API Error:', error.response?.status, error.response?.data || error.message);
    }

  } catch (error) {
    console.error('General Error:', error.message);
  }
}

testRevenueAPI();
