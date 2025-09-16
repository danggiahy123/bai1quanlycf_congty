const axios = require('axios');

const API_URL = 'http://192.168.1.6:5000';

async function testCompleteSystem() {
  console.log('🧪 Testing Complete System...\n');

  try {
    // 1. Test health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health check:', healthResponse.data);

    // 2. Test employee login
    console.log('\n2. Testing employee login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/api/employees/login`, {
        username: 'test_employee',
        password: 'password123'
      });
      console.log('✅ Employee login:', loginResponse.data);
      const token = loginResponse.data.token;

      // 3. Test admin bookings with token
      console.log('\n3. Testing admin bookings with token...');
      try {
        const bookingsResponse = await axios.get(`${API_URL}/api/bookings/admin?status=pending`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Admin bookings:', bookingsResponse.data);
      } catch (error) {
        console.log('❌ Admin bookings error:', error.response?.status, error.response?.data?.message);
      }

      // 4. Test notifications
      console.log('\n4. Testing notifications...');
      try {
        const notificationsResponse = await axios.get(`${API_URL}/api/notifications/employee`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Notifications:', notificationsResponse.data);
      } catch (error) {
        console.log('❌ Notifications error:', error.response?.status, error.response?.data?.message);
      }

    } catch (error) {
      console.log('❌ Employee login error:', error.response?.status, error.response?.data?.message);
    }

    // 5. Test customer login
    console.log('\n5. Testing customer login...');
    try {
      const customerLoginResponse = await axios.post(`${API_URL}/api/customers/login`, {
        username: 'test_customer',
        password: 'password123'
      });
      console.log('✅ Customer login:', customerLoginResponse.data);
    } catch (error) {
      console.log('❌ Customer login error:', error.response?.status, error.response?.data?.message);
    }

    // 6. Test create test data
    console.log('\n6. Creating test data...');
    try {
      const createEmployeeResponse = await axios.post(`${API_URL}/api/employees/register`, {
        username: 'test_employee',
        password: 'password123',
        name: 'Test Employee',
        role: 'employee'
      });
      console.log('✅ Employee created:', createEmployeeResponse.data);
    } catch (error) {
      console.log('ℹ️ Employee already exists or error:', error.response?.data?.message);
    }

    try {
      const createCustomerResponse = await axios.post(`${API_URL}/api/customers/register`, {
        username: 'test_customer',
        password: 'password123',
        name: 'Test Customer',
        phone: '0123456789'
      });
      console.log('✅ Customer created:', createCustomerResponse.data);
    } catch (error) {
      console.log('ℹ️ Customer already exists or error:', error.response?.data?.message);
    }

  } catch (error) {
    console.log('❌ System error:', error.message);
  }
}

testCompleteSystem();
