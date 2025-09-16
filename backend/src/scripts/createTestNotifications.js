const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestNotifications() {
  try {
    console.log('📝 Creating test notifications...');

    // Tìm hoặc tạo customer test
    let customer = await Customer.findOne({ email: 'test@example.com' });
    if (!customer) {
      customer = new Customer({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        username: 'testuser',
        password: 'password123'
      });
      await customer.save();
      console.log('✅ Created test customer');
    } else {
      console.log('✅ Found existing test customer');
    }

    // Xóa thông báo cũ
    await Notification.deleteMany({ user: customer._id });
    console.log('✅ Cleared old notifications');

    // Tạo thông báo xác nhận bàn
    const confirmNotification = new Notification({
      user: customer._id,
      type: 'booking_confirmed',
      title: 'Đặt bàn thành công!',
      message: 'Bàn A1 đã được xác nhận cho ngày 15/12/2024 lúc 19:00',
      bookingId: null
    });
    await confirmNotification.save();

    // Tạo thông báo hủy bàn
    const cancelNotification = new Notification({
      user: customer._id,
      type: 'booking_cancelled',
      title: 'Đặt bàn đã bị hủy',
      message: 'Đặt bàn của bạn đã bị hủy với lý do: Bàn bị hỏng. Vui lòng liên hệ để biết thêm chi tiết.',
      bookingId: null
    });
    await cancelNotification.save();

    // Tạo thông báo nhắc nhở
    const reminderNotification = new Notification({
      user: customer._id,
      type: 'booking_reminder',
      title: 'Nhắc nhở đặt bàn',
      message: 'Đừng quên đặt bàn cho bữa tối cuối tuần này nhé!',
      bookingId: null
    });
    await reminderNotification.save();

    // Tạo token cho test
    const token = jwt.sign(
      { 
        id: customer._id, 
        email: customer.email,
        role: 'customer'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ Created test notifications');
    console.log('📊 Total notifications:', await Notification.countDocuments({ user: customer._id }));
    console.log('📊 Unread notifications:', await Notification.countDocuments({ user: customer._id, isRead: false }));
    
    console.log('\n🔑 Test Token:');
    console.log(token);
    
    console.log('\n📱 To test in mobile app:');
    console.log('1. Copy the token above');
    console.log('2. In mobile app, go to AsyncStorage and set token');
    console.log('3. Restart the app to load notifications');

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestNotifications();
