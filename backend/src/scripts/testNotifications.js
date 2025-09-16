const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testNotifications() {
  try {
    console.log('🧪 Testing notification system...');

    // Tìm một customer để test
    const customer = await Customer.findOne();
    if (!customer) {
      console.log('❌ No customer found. Please create a customer first.');
      return;
    }

    console.log(`👤 Testing with customer: ${customer.fullName}`);

    // Tạo thông báo xác nhận bàn
    const confirmNotification = new Notification({
      user: customer._id,
      type: 'booking_confirmed',
      title: 'Đặt bàn thành công!',
      message: 'Bàn A1 đã được xác nhận cho ngày 15/12/2024 lúc 19:00',
      bookingId: null
    });

    await confirmNotification.save();
    console.log('✅ Created confirmation notification');

    // Tạo thông báo hủy bàn
    const cancelNotification = new Notification({
      user: customer._id,
      type: 'booking_cancelled',
      title: 'Đặt bàn đã bị hủy',
      message: 'Đặt bàn của bạn đã bị hủy với lý do: Bàn bị hỏng. Vui lòng liên hệ để biết thêm chi tiết.',
      bookingId: null
    });

    await cancelNotification.save();
    console.log('✅ Created cancellation notification');

    // Lấy danh sách thông báo
    const notifications = await Notification.find({ user: customer._id })
      .sort({ createdAt: -1 });

    console.log(`📱 Found ${notifications.length} notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} - ${notif.message}`);
    });

    // Test đánh dấu đã đọc
    await Notification.findByIdAndUpdate(
      confirmNotification._id,
      { isRead: true, readAt: new Date() }
    );
    console.log('✅ Marked notification as read');

    // Test đếm thông báo chưa đọc
    const unreadCount = await Notification.countDocuments({
      user: customer._id,
      isRead: false
    });
    console.log(`📊 Unread notifications: ${unreadCount}`);

    console.log('🎉 Notification system test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  } finally {
    mongoose.connection.close();
  }
}

testNotifications();
