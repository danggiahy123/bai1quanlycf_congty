const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');
const Employee = require('./src/models/Employee');

mongoose.connect('mongodb://localhost:27017/cafe_management');

async function debugNotification() {
  try {
    console.log('🔍 Debug notification creation...\n');

    // Tìm admin users
    const admins = await Employee.find({ role: 'admin' });
    console.log('👑 Found admins:', admins.length);
    admins.forEach((admin, i) => {
      console.log(`  ${i+1}. ${admin.fullName} (${admin._id})`);
    });

    // Tạo thông báo test cho admin
    if (admins.length > 0) {
      const adminNotification = new Notification({
        user: admins[0]._id,
        type: 'booking_pending',
        title: '📋 ĐẶT BÀN MỚI CẦN DUYỆT',
        message: 'Test notification for admin - Debug test',
        bookingId: null,
        isRead: false
      });

      await adminNotification.save();
      console.log('✅ Admin notification created successfully!');
      console.log('   ID:', adminNotification._id);
      console.log('   User:', adminNotification.user);
    }

    // Tạo thông báo chung
    const generalNotification = new Notification({
      user: null,
      type: 'booking_pending',
      title: '📋 ĐẶT BÀN MỚI CẦN DUYỆT',
      message: 'Test general notification - Debug test',
      bookingId: null,
      isRead: false
    });

    await generalNotification.save();
    console.log('✅ General notification created successfully!');
    console.log('   ID:', generalNotification._id);
    console.log('   User:', generalNotification.user);

    // Kiểm tra thông báo mới
    const recentNotifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('\n📋 Recent Notifications:');
    recentNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.type}] ${notification.title}`);
      console.log(`     User: ${notification.user || 'General'}`);
      console.log(`     Created: ${notification.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error debugging notification:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

debugNotification();
