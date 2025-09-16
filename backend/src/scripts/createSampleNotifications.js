const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Customer = require('../models/Customer');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSampleNotifications() {
  try {
    console.log('📝 Creating sample notifications...');

    // Tìm tất cả customers
    const customers = await Customer.find();
    if (customers.length === 0) {
      console.log('❌ No customers found. Please create customers first.');
      return;
    }

    // Tạo thông báo mẫu cho mỗi customer
    for (const customer of customers) {
      // Xóa thông báo cũ nếu có
      await Notification.deleteMany({ user: customer._id });

      // Tạo thông báo xác nhận bàn
      const confirmNotification = new Notification({
        user: customer._id,
        type: 'booking_confirmed',
        title: 'Đặt bàn thành công!',
        message: `Bàn A${Math.floor(Math.random() * 5) + 1} đã được xác nhận cho ngày ${new Date().toLocaleDateString('vi-VN')} lúc ${Math.floor(Math.random() * 12) + 18}:00`,
        bookingId: null
      });

      await confirmNotification.save();

      // Tạo thông báo hủy bàn (một số ngẫu nhiên)
      if (Math.random() > 0.7) {
        const cancelNotification = new Notification({
          user: customer._id,
          type: 'booking_cancelled',
          title: 'Đặt bàn đã bị hủy',
          message: 'Đặt bàn của bạn đã bị hủy với lý do: Bàn bị hỏng. Vui lòng liên hệ để biết thêm chi tiết.',
          bookingId: null
        });

        await cancelNotification.save();
      }

      // Tạo thông báo nhắc nhở (một số ngẫu nhiên)
      if (Math.random() > 0.8) {
        const reminderNotification = new Notification({
          user: customer._id,
          type: 'booking_reminder',
          title: 'Nhắc nhở đặt bàn',
          message: 'Đừng quên đặt bàn cho bữa tối cuối tuần này nhé!',
          bookingId: null
        });

        await reminderNotification.save();
      }

      console.log(`✅ Created notifications for ${customer.fullName}`);
    }

    // Thống kê
    const totalNotifications = await Notification.countDocuments();
    const unreadCount = await Notification.countDocuments({ isRead: false });
    
    console.log(`📊 Total notifications: ${totalNotifications}`);
    console.log(`📊 Unread notifications: ${unreadCount}`);
    console.log('🎉 Sample notifications created successfully!');

  } catch (error) {
    console.error('❌ Error creating sample notifications:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSampleNotifications();
