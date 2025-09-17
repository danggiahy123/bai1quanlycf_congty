const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Customer = require('../models/Customer');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkNotifications() {
  try {
    console.log('🔍 Checking notifications...');

    // Tìm customer test
    const customer = await Customer.findOne({ email: 'test@example.com' });
    if (!customer) {
      console.log('❌ No test customer found');
      return;
    }

    console.log('👤 Customer:', customer.fullName, customer._id);

    // Tìm thông báo
    const notifications = await Notification.find({ user: customer._id });
    console.log('📊 Total notifications for this user:', notifications.length);

    if (notifications.length > 0) {
      console.log('\n📱 Notifications:');
      notifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title} - ${notif.message}`);
        console.log(`   Type: ${notif.type}, Read: ${notif.isRead}`);
      });
    } else {
      console.log('❌ No notifications found for this user');
      
      // Tạo thông báo mới
      console.log('📝 Creating new notifications...');
      const newNotification = new Notification({
        user: customer._id,
        type: 'booking_confirmed',
        title: 'Đặt bàn thành công!',
        message: 'Bàn A1 đã được xác nhận cho ngày 15/12/2024 lúc 19:00',
        bookingId: null
      });
      await newNotification.save();
      console.log('✅ Created new notification');
    }

  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkNotifications();
