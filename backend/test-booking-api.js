const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000';

// Test data
const testBookingData = {
  tableId: '507f1f77bcf86cd799439011', // Thay bằng tableId thật
  numberOfGuests: 2,
  bookingDate: '2024-01-15',
  bookingTime: '19:00',
  menuItems: [
    {
      itemId: '507f1f77bcf86cd799439012', // Thay bằng menuItemId thật
      quantity: 2
    }
  ],
  notes: 'Test booking from script',
  depositAmount: 100000,
  customerInfo: {
    fullName: 'Test Customer',
    phone: '0123456789',
    email: 'test@example.com'
  }
};

async function testBookingAPI() {
  try {
    console.log('🧪 Testing Booking API...');
    console.log('📤 Sending data:', JSON.stringify(testBookingData, null, 2));

    const response = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Thay bằng token thật
      },
      body: JSON.stringify(testBookingData)
    });

    console.log('📥 Response status:', response.status);
    
    const responseData = await response.json();
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ Booking API test successful!');
    } else {
      console.log('❌ Booking API test failed!');
    }
  } catch (error) {
    console.error('❌ Error testing booking API:', error.message);
  }
}

// Test với dữ liệu không hợp lệ
async function testInvalidBookingAPI() {
  try {
    console.log('\n🧪 Testing Invalid Booking API...');
    
    const invalidData = {
      tableId: 'invalid-id',
      numberOfGuests: 0,
      bookingDate: '2024-01-01',
      bookingTime: '10:00',
      menuItems: [],
      notes: '',
      depositAmount: 1000, // Quá thấp
      customerInfo: {
        fullName: '',
        phone: '',
        email: ''
      }
    };

    console.log('📤 Sending invalid data:', JSON.stringify(invalidData, null, 2));

    const response = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(invalidData)
    });

    console.log('📥 Response status:', response.status);
    
    const responseData = await response.json();
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.log('✅ Invalid data correctly rejected!');
    } else {
      console.log('❌ Invalid data was accepted (this is wrong)!');
    }
  } catch (error) {
    console.error('❌ Error testing invalid booking API:', error.message);
  }
}

// Chạy tests
testBookingAPI();
testInvalidBookingAPI();
