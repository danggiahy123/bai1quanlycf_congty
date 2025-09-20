const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');
const Employee = require('./src/models/Employee');

mongoose.connect('mongodb://localhost:27017/cafe_management');

async function testNotificationCreation() {
  try {
    console.log('🔍 Testing notification creation for admin...\n');

    // Tìm admin
    const admins = await Employee.find({ role: 'admin' });
    console.log('👑 Found admins:', admins.length);
    
    if (admins.length === 0) {
      console.log('❌ No admin found!');
      return;
    }

    const admin = admins[0];
    console.log('👑 Using admin:', admin.fullName, '(ID:', admin._id, ')');

    // Tạo thông báo cho admin
    const adminNotification = new Notification({
      user: admin._id,
      type: 'booking_pending',
      title: '📋 ĐẶT BÀN MỚI CẦN DUYỆT',
      message: 'Nhân viên Test đã đặt bàn Bàn máy lạnh 2 cho khách Test With Admin (3 người) - 20/01/2024 20:30. Cọc: 150,000đ Vui lòng duyệt đặt bàn.',
      bookingId: null,
      isRead: false
    });

    await adminNotification.save();
    console.log('✅ Admin notification created successfully!');
    console.log('   ID:', adminNotification._id);
    console.log('   User:', adminNotification.user);
    console.log('   Title:', adminNotification.title);

    // Tạo thông báo chung
    const generalNotification = new Notification({
      user: null,
      type: 'booking_pending',
      title: '📋 ĐẶT BÀN MỚI',
      message: 'Nhân viên Test đã đặt bàn Bàn máy lạnh 2 cho khách Test With Admin (3 người) - 20/01/2024 20:30. Cọc: 150,000đ',
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
      .limit(3);

    console.log('\n📋 Recent Notifications:');
    recentNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.type}] ${notification.title}`);
      console.log(`     User: ${notification.user || 'General'}`);
      console.log(`     Created: ${notification.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error testing notification creation:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

testNotificationCreation();
