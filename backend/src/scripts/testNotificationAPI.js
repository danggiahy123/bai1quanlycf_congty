// Using built-in fetch in Node.js 18+

async function testNotificationAPI() {
  try {
    console.log('🧪 Testing Notification API...');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test notifications endpoint (without auth - should return 401)
    console.log('\n2. Testing notifications endpoint without auth...');
    try {
      const notifResponse = await fetch('http://localhost:5000/api/notifications');
      const notifData = await notifResponse.json();
      console.log('Response:', notifData);
    } catch (error) {
      console.log('Expected error (no auth):', error.message);
    }

    // Test with invalid token
    console.log('\n3. Testing notifications endpoint with invalid token...');
    try {
      const invalidTokenResponse = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json',
        },
      });
      const invalidTokenData = await invalidTokenResponse.json();
      console.log('Response:', invalidTokenData);
    } catch (error) {
      console.log('Error:', error.message);
    }

    console.log('\n🎉 API test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure you have a valid user token in AsyncStorage');
    console.log('2. Check if the mobile app can connect to http://localhost:5000');
    console.log('3. If using physical device, use your computer\'s IP address instead of localhost');

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testNotificationAPI();
