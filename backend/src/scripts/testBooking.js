const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000';

async function testBooking() {
  try {
    console.log('🧪 Testing booking flow...\n');
    
    // 1. Login as customer
    console.log('1. Logging in as customer...');
    const loginResponse = await axios.post(`${API_URL}/api/customers/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // 2. Get menu items
    console.log('\n2. Getting menu items...');
    const menuResponse = await axios.get(`${API_URL}/api/menu`);
    const menuItems = menuResponse.data;
    console.log(`✅ Found ${menuItems.length} menu items:`);
    menuItems.forEach(item => {
      console.log(`   - ${item.name}: ${item.price.toLocaleString()}đ`);
    });
    
    // 3. Get tables
    console.log('\n3. Getting tables...');
    const tablesResponse = await axios.get(`${API_URL}/api/tables`);
    const tables = tablesResponse.data;
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${table.name} (${table.status})`);
    });
    
    // 4. Create booking
    console.log('\n4. Creating booking...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDate = tomorrow.toISOString().split('T')[0];
    
    const bookingData = {
      tableId: tables[0]._id,
      numberOfGuests: 2,
      bookingDate: bookingDate,
      bookingTime: '19:00',
      menuItems: [
        {
          itemId: menuItems[0]._id,
          quantity: 2
        },
        {
          itemId: menuItems[1]._id,
          quantity: 1
        }
      ],
      notes: 'Test booking from script'
    };
    
    console.log('Booking data:', JSON.stringify(bookingData, null, 2));
    
    const bookingResponse = await axios.post(`${API_URL}/api/bookings`, bookingData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Booking created successfully!');
    console.log('Booking ID:', bookingResponse.data._id);
    console.log('Status:', bookingResponse.data.status);
    console.log('Total amount:', bookingResponse.data.totalAmount.toLocaleString() + 'đ');
    
    // 5. Check booking in admin
    console.log('\n5. Checking booking in admin...');
    const adminLoginResponse = await axios.post(`${API_URL}/api/employees/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin login successful');
    
    const bookingsResponse = await axios.get(`${API_URL}/api/bookings?status=pending&page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const bookings = bookingsResponse.data.bookings;
    console.log(`✅ Found ${bookings.length} pending bookings`);
    
    if (bookings.length > 0) {
      const latestBooking = bookings[0];
      console.log('Latest booking:');
      console.log(`   - ID: ${latestBooking._id}`);
      console.log(`   - Customer: ${latestBooking.customer?.fullName || latestBooking.customerInfo?.fullName}`);
      console.log(`   - Table: ${latestBooking.table.name}`);
      console.log(`   - Date: ${latestBooking.bookingDate} ${latestBooking.bookingTime}`);
      console.log(`   - Status: ${latestBooking.status}`);
      console.log(`   - Total: ${latestBooking.totalAmount.toLocaleString()}đ`);
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBooking();
