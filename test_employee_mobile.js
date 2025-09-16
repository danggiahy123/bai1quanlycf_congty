const axios = require('axios');

// Test API endpoints for employee mobile app
async function testEmployeeAPI() {
  console.log('🧪 Testing Employee Mobile API...\n');

  // Test 1: Health check
  try {
    console.log('1. Testing health check...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Employee login
  try {
    console.log('\n2. Testing employee login...');
    const loginResponse = await axios.post('http://localhost:5000/api/employees/login', {
      username: 'employee_test',
      password: '123456'
    });
    console.log('✅ Login successful:', {
      message: loginResponse.data.message,
      hasToken: !!loginResponse.data.token,
      employee: loginResponse.data.employee
    });
    
    const token = loginResponse.data.token;
    
    // Test 3: Get bookings (employee view)
    try {
      console.log('\n3. Testing get bookings for employee...');
      const bookingsResponse = await axios.get('http://localhost:5000/api/bookings/employee', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Bookings loaded:', {
        count: bookingsResponse.data.bookings?.length || 0,
        data: bookingsResponse.data
      });
    } catch (error) {
      console.log('❌ Get bookings failed:', error.response?.data || error.message);
    }

    // Test 4: Get tables
    try {
      console.log('\n4. Testing get tables...');
      const tablesResponse = await axios.get('http://localhost:5000/api/tables', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Tables loaded:', {
        count: tablesResponse.data?.length || 0,
        data: tablesResponse.data
      });
    } catch (error) {
      console.log('❌ Get tables failed:', error.response?.data || error.message);
    }

    // Test 5: Get notifications
    try {
      console.log('\n5. Testing get notifications...');
      const notificationsResponse = await axios.get('http://localhost:5000/api/notifications/employee', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Notifications loaded:', {
        count: notificationsResponse.data.notifications?.length || 0,
        unreadCount: notificationsResponse.data.unreadCount || 0,
        data: notificationsResponse.data
      });
    } catch (error) {
      console.log('❌ Get notifications failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testEmployeeAPI().catch(console.error);
