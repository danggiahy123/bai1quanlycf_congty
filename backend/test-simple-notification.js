const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');
const Employee = require('./src/models/Employee');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testSimpleNotification() {
  try {
    console.log('🔍 Testing simple notification creation...\n');
    console.log('MongoDB connection status:', mongoose.connection.readyState);

    // Tạo thông báo test
    const testNotification = new Notification({
      user: null, // Thông báo chung
      type: 'booking_pending',
      title: '🧪 TEST NOTIFICATION',
      message: 'This is a test notification created at ' + new Date().toISOString(),
      bookingId: null,
      isRead: false
    });

    await testNotification.save();
    console.log('✅ Test notification created successfully!');
    console.log('   ID:', testNotification._id);
    console.log('   Title:', testNotification.title);
    console.log('   Message:', testNotification.message);

    // Lấy tất cả thông báo gần đây
    const recentNotifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('\n📋 Recent Notifications:');
    recentNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.type}] ${notification.title}`);
      console.log(`     Created: ${notification.createdAt}`);
      console.log(`     User: ${notification.user || 'General'}`);
    });

  } catch (error) {
    console.error('❌ Error testing notification:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

testSimpleNotification();
