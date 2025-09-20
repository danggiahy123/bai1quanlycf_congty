const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');
const Employee = require('./src/models/Employee');
const Customer = require('./src/models/Customer');
const Booking = require('./src/models/Booking');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testNotifications() {
  try {
    console.log('🔍 Testing notifications...\n');

    // Lấy tất cả thông báo
    const allNotifications = await Notification.find({})
      .populate('user', 'fullName username role')
      .populate('bookingId', 'table numberOfGuests bookingDate bookingTime totalAmount status')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('📋 All Notifications:');
    allNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.type}] ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     User: ${notification.user ? notification.user.fullName : 'General'}`);
      console.log(`     Created: ${notification.createdAt}`);
      console.log(`     Read: ${notification.isRead ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Lấy thông báo cho admin
    const adminNotifications = await Notification.find({ 
      'user.role': 'admin' 
    }).populate('user', 'fullName username role');

    console.log(`\n👑 Admin Notifications: ${adminNotifications.length}`);
    adminNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.type}] ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
    });

    // Lấy thông báo pending (cần duyệt)
    const pendingNotifications = await Notification.find({ 
      type: 'booking_pending' 
    }).populate('user', 'fullName username role');

    console.log(`\n⏳ Pending Notifications: ${pendingNotifications.length}`);
    pendingNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.type}] ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
    });

    // Lấy thông báo confirmed
    const confirmedNotifications = await Notification.find({ 
      type: 'booking_confirmed' 
    }).populate('user', 'fullName username role');

    console.log(`\n✅ Confirmed Notifications: ${confirmedNotifications.length}`);
    confirmedNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.type}] ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
    });

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  } finally {
    mongoose.connection.close();
  }
}

testNotifications();
