const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Customer = require('../models/Customer');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database...');

    // Tìm customer test
    const customer = await Customer.findOne({ email: 'test@example.com' });
    if (!customer) {
      console.log('❌ No test customer found');
      return;
    }

    console.log('👤 Customer:', customer.fullName, customer._id);
    console.log('👤 Customer ID type:', typeof customer._id);

    // Tìm tất cả thông báo
    const allNotifications = await Notification.find({});
    console.log('📊 Total notifications in DB:', allNotifications.length);

    if (allNotifications.length > 0) {
      console.log('\n📱 All notifications:');
      allNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. User: ${notif.user}, Title: ${notif.title}`);
        console.log(`   User type: ${typeof notif.user}`);
        console.log(`   User equals customer._id: ${notif.user.equals(customer._id)}`);
        console.log(`   User toString: ${notif.user.toString()}`);
        console.log(`   Customer._id toString: ${customer._id.toString()}`);
      });
    }

    // Tìm thông báo cho user này
    const userNotifications = await Notification.find({ user: customer._id });
    console.log('\n📊 Notifications for this user:', userNotifications.length);

    // Test với ObjectId
    const userId = new mongoose.Types.ObjectId(customer._id.toString());
    const objectIdNotifications = await Notification.find({ user: userId });
    console.log('📊 Notifications with ObjectId:', objectIdNotifications.length);

  } catch (error) {
    console.error('❌ Error debugging database:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugDatabase();
