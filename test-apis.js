const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPIs() {
  console.log('🧪 Bắt đầu kiểm tra các API...\n');

  // Test 1: API Booking Test
  try {
    console.log('1️⃣ Kiểm tra API Booking Test...');
    const response = await axios.get(`${BASE_URL}/bookings/test`);
    console.log('✅ API Booking Test:', response.data.message);
  } catch (error) {
    console.log('❌ API Booking Test lỗi:', error.response?.data || error.message);
  }

  // Test 2: API Booking Stats
  try {
    console.log('\n2️⃣ Kiểm tra API Booking Stats...');
    const response = await axios.get(`${BASE_URL}/bookings/stats`);
    console.log('✅ API Booking Stats:', response.data);
  } catch (error) {
    console.log('❌ API Booking Stats lỗi:', error.response?.data || error.message);
  }

  // Test 3: API Booking Employee
  try {
    console.log('\n3️⃣ Kiểm tra API Booking Employee...');
    const response = await axios.get(`${BASE_URL}/bookings/employee?limit=3`);
    console.log('✅ API Booking Employee:');
    console.log(`   - Tổng số booking: ${response.data.total}`);
    console.log(`   - Số trang: ${response.data.totalPages}`);
    console.log(`   - Booking đầu tiên: ${response.data.bookings[0]?.customerInfo?.fullName || 'N/A'}`);
  } catch (error) {
    console.log('❌ API Booking Employee lỗi:', error.response?.data || error.message);
  }

  // Test 4: API Booking Admin
  try {
    console.log('\n4️⃣ Kiểm tra API Booking Admin...');
    const response = await axios.get(`${BASE_URL}/bookings/admin?status=all&limit=3`);
    console.log('✅ API Booking Admin:');
    console.log(`   - Tổng số booking: ${response.data.pagination.total}`);
    console.log(`   - Số trang: ${response.data.pagination.pages}`);
  } catch (error) {
    console.log('❌ API Booking Admin lỗi:', error.response?.data || error.message);
  }

  // Test 5: API Search Customers
  try {
    console.log('\n5️⃣ Kiểm tra API Search Customers...');
    const response = await axios.get(`${BASE_URL}/bookings/search-customers?phone=0987654321`);
    console.log('✅ API Search Customers:', response.data);
  } catch (error) {
    console.log('❌ API Search Customers lỗi:', error.response?.data || error.message);
  }

  // Test 6: API Dashboard Stats (sẽ lỗi vì cần token)
  try {
    console.log('\n6️⃣ Kiểm tra API Dashboard Stats (không có token)...');
    const response = await axios.get(`${BASE_URL}/dashboard/stats`);
    console.log('✅ API Dashboard Stats:', response.data);
  } catch (error) {
    console.log('❌ API Dashboard Stats lỗi (dự kiến):', error.response?.data?.message || error.message);
  }

  // Test 7: API Dashboard Revenue (sẽ lỗi vì cần token)
  try {
    console.log('\n7️⃣ Kiểm tra API Dashboard Revenue (không có token)...');
    const response = await axios.get(`${BASE_URL}/dashboard/revenue?range=day`);
    console.log('✅ API Dashboard Revenue:', response.data);
  } catch (error) {
    console.log('❌ API Dashboard Revenue lỗi (dự kiến):', error.response?.data?.message || error.message);
  }

  // Test 8: API Dashboard Top Items (sẽ lỗi vì cần token)
  try {
    console.log('\n8️⃣ Kiểm tra API Dashboard Top Items (không có token)...');
    const response = await axios.get(`${BASE_URL}/dashboard/top-items?limit=5`);
    console.log('✅ API Dashboard Top Items:', response.data);
  } catch (error) {
    console.log('❌ API Dashboard Top Items lỗi (dự kiến):', error.response?.data?.message || error.message);
  }

  // Test 9: API Dashboard Recent Activities (sẽ lỗi vì cần token)
  try {
    console.log('\n9️⃣ Kiểm tra API Dashboard Recent Activities (không có token)...');
    const response = await axios.get(`${BASE_URL}/dashboard/recent-activities?limit=5`);
    console.log('✅ API Dashboard Recent Activities:', response.data);
  } catch (error) {
    console.log('❌ API Dashboard Recent Activities lỗi (dự kiến):', error.response?.data?.message || error.message);
  }

  console.log('\n🎉 Hoàn thành kiểm tra API!');
}

// Chạy test
testAPIs().catch(console.error);
