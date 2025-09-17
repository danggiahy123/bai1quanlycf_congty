// Test API với token thật
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzkwZGJkMTZiYWQxNWU2NzcxYzhhMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1ODAwNzg5NywiZXhwIjoxNzU4MDk0Mjk3fQ.eWbHhkvBgfUOVViwnnlcW5rz0Hw6iv2pzt8r1GA2uB0';

async function testWithToken() {
  try {
    console.log('🧪 Testing API with valid token...');

    // Test notifications endpoint với token
    const response = await fetch('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Successfully loaded notifications:');
      console.log('📊 Total notifications:', data.notifications.length);
      console.log('📊 Unread count:', data.unreadCount);
      console.log('\n📱 Notifications:');
      data.notifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title} - ${notif.message}`);
      });
    } else {
      const errorData = await response.json();
      console.log('❌ Error:', errorData);
    }

  } catch (error) {
    console.error('❌ Error testing with token:', error);
  }
}

testWithToken();
