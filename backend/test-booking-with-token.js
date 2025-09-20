const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000';

// Test data
const testBookingData = {
  tableId: '10005',
  numberOfGuests: 2,
  bookingDate: '2024-01-19',
  bookingTime: '19:30',
  menuItems: [
    {
      itemId: '62867',
      quantity: 2
    }
  ],
  notes: 'Test booking with token',
  depositAmount: 100000,
  customerInfo: {
    fullName: 'Test Customer Token',
    phone: '0123456789',
    email: 'test@example.com'
  }
};

async function testBookingWithToken() {
  try {
    console.log('🧪 Testing Booking API with token...');
    console.log('📤 Sending data:', JSON.stringify(testBookingData, null, 2));

    // Sử dụng admin-quick-booking (không cần token)
    const response = await fetch(`${API_URL}/api/bookings/admin-quick-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testBookingData)
    });

    console.log('📥 Response status:', response.status);
    
    const responseData = await response.json();
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ Booking API test successful!');
      
      // Kiểm tra thông báo sau khi tạo booking
      console.log('\n🔍 Checking notifications after booking...');
      
      const notificationResponse = await fetch(`${API_URL}/api/notifications/employee`);
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        console.log('📋 Notifications found:', notificationData.notifications?.length || 0);
        
        if (notificationData.notifications && notificationData.notifications.length > 0) {
          console.log('Latest notifications:');
          notificationData.notifications.slice(0, 3).forEach((n, i) => {
            console.log(`  ${i+1}. [${n.type}] ${n.title}`);
            console.log(`     Message: ${n.message}`);
            console.log(`     User: ${n.user || 'General'}`);
          });
        }
      } else {
        console.log('❌ Could not fetch notifications (need token)');
      }
    } else {
      console.log('❌ Booking API test failed!');
    }
  } catch (error) {
    console.error('❌ Error testing booking API:', error.message);
  }
}

testBookingWithToken();
