const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testBookingsAPI() {
  console.log('=== TEST API BOOKINGS ===\n');

  try {
    // Test GET /api/bookings
    console.log('1. Test GET /api/bookings...');
    const response = await axios.get(`${API_URL}/api/bookings`);
    console.log('✅ API bookings hoạt động!');
    console.log('   - Status:', response.status);
    console.log('   - Data:', response.data);
  } catch (error) {
    console.error('❌ Lỗi API bookings:', error.response?.status, error.response?.data);
  }

  try {
    // Test với query parameters
    console.log('\n2. Test với query parameters...');
    const response = await axios.get(`${API_URL}/api/bookings?status=all&page=1&limit=10`);
    console.log('✅ API bookings với params hoạt động!');
    console.log('   - Status:', response.status);
    console.log('   - Data:', response.data);
  } catch (error) {
    console.error('❌ Lỗi API bookings với params:', error.response?.status, error.response?.data);
  }
}

testBookingsAPI();
