const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testDirectQuery() {
  try {
    console.log('🔍 Testing direct query...');

    const userId = '68c90dbd16bad15e6771c8a1';
    const objectId = new mongoose.Types.ObjectId(userId);
    
    console.log('User ID string:', userId);
    console.log('User ID ObjectId:', objectId);

    // Test query với string
    const stringQuery = await Notification.find({ user: userId });
    console.log('Query with string:', stringQuery.length);

    // Test query với ObjectId
    const objectIdQuery = await Notification.find({ user: objectId });
    console.log('Query with ObjectId:', objectIdQuery.length);

    // Test query với regex
    const regexQuery = await Notification.find({ user: { $regex: userId, $options: 'i' } });
    console.log('Query with regex:', regexQuery.length);

    // Test tất cả thông báo
    const allNotifications = await Notification.find({});
    console.log('All notifications:', allNotifications.length);
    
    if (allNotifications.length > 0) {
      console.log('First notification user field:', allNotifications[0].user);
      console.log('First notification user type:', typeof allNotifications[0].user);
    }

  } catch (error) {
    console.error('❌ Error testing query:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDirectQuery();
