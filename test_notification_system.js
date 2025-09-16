const axios = require('axios');

const API_URL = 'http://192.168.1.6:5000';

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System...\n');

  try {
    // 1. Test health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health check:', healthResponse.data);

    // 2. Test booking endpoints
    console.log('\n2. Testing booking endpoints...');
    
    // Test admin booking endpoint
    try {
      const adminBookingsResponse = await axios.get(`${API_URL}/api/bookings/admin?status=pending`);
      console.log('✅ Admin bookings endpoint:', adminBookingsResponse.status);
      console.log('   Bookings found:', adminBookingsResponse.data.bookings?.length || 0);
    } catch (error) {
      console.log('❌ Admin bookings error:', error.response?.status, error.response?.data?.message);
    }

    // Test customer booking endpoint (without auth)
    try {
      const customerBookingsResponse = await axios.get(`${API_URL}/api/bookings/my-bookings`);
      console.log('✅ Customer bookings endpoint:', customerBookingsResponse.status);
    } catch (error) {
      console.log('❌ Customer bookings error (expected without auth):', error.response?.status);
    }

    // 3. Test notification endpoints
    console.log('\n3. Testing notification endpoints...');
    
    // Test general notification endpoint (without auth)
    try {
      const notificationsResponse = await axios.get(`${API_URL}/api/notifications`);
      console.log('✅ Notifications endpoint:', notificationsResponse.status);
    } catch (error) {
      console.log('❌ Notifications error (expected without auth):', error.response?.status);
    }

    // Test customer notification endpoint (without auth)
    try {
      const customerNotificationsResponse = await axios.get(`${API_URL}/api/notifications/customer`);
      console.log('✅ Customer notifications endpoint:', customerNotificationsResponse.status);
    } catch (error) {
      console.log('❌ Customer notifications error (expected without auth):', error.response?.status);
    }

    // Test employee notification endpoint
    try {
      const employeeNotificationsResponse = await axios.get(`${API_URL}/api/notifications/employee`);
      console.log('✅ Employee notifications endpoint:', employeeNotificationsResponse.status);
      console.log('   Notifications found:', employeeNotificationsResponse.data.notifications?.length || 0);
    } catch (error) {
      console.log('❌ Employee notifications error:', error.response?.status, error.response?.data?.message);
    }

    // 4. Test menu endpoint
    console.log('\n4. Testing menu endpoint...');
    try {
      const menuResponse = await axios.get(`${API_URL}/api/menu`);
      console.log('✅ Menu endpoint:', menuResponse.status);
      console.log('   Menu items found:', menuResponse.data?.length || 0);
    } catch (error) {
      console.log('❌ Menu error:', error.response?.status, error.response?.data?.message);
    }

    // 5. Test tables endpoint
    console.log('\n5. Testing tables endpoint...');
    try {
      const tablesResponse = await axios.get(`${API_URL}/api/tables`);
      console.log('✅ Tables endpoint:', tablesResponse.status);
      console.log('   Tables found:', tablesResponse.data?.length || 0);
    } catch (error) {
      console.log('❌ Tables error:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n🎉 Notification system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotificationSystem();
