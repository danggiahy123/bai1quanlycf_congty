const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Notification = require('./src/models/Notification');
const Customer = require('./src/models/Customer');

async function debugNotifications() {
  try {
    console.log('🔍 Debugging notification system...\n');

    // 1. Check if notifications exist
    const allNotifications = await Notification.find({});
    console.log('📋 All notifications in database:', allNotifications.length);
    allNotifications.forEach(notif => {
      console.log(`  - ID: ${notif._id}, User: ${notif.user}, Type: ${notif.type}, Title: ${notif.title}`);
    });

    // 2. Find all customers first
    const allCustomers = await Customer.find({});
    console.log(`\n👥 All customers in database:`, allCustomers.length);
    allCustomers.forEach(customer => {
      console.log(`  - ID: ${customer._id}, Name: ${customer.fullName}, Email: ${customer.email}`);
    });

    // 3. Use first customer for testing
    const customerId = allCustomers.length > 0 ? allCustomers[0]._id : null;
    if (!customerId) {
      console.log('❌ No customers found in database');
      return;
    }

    const customerNotifications = await Notification.find({ user: customerId });
    console.log(`\n👤 Notifications for customer ${customerId}:`, customerNotifications.length);
    customerNotifications.forEach(notif => {
      console.log(`  - ID: ${notif._id}, Type: ${notif.type}, Title: ${notif.title}, Message: ${notif.message}`);
    });

    // 4. Check if customer exists
    const customer = await Customer.findById(customerId);
    console.log(`\n👤 Customer exists:`, !!customer);
    if (customer) {
      console.log(`  - Name: ${customer.fullName}, Email: ${customer.email}`);
    }

    // 4. Try to create a test notification
    console.log('\n🧪 Creating test notification...');
    const testNotification = new Notification({
      user: customerId,
      type: 'booking_pending',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system works',
      isRead: false
    });

    await testNotification.save();
    console.log('✅ Test notification created successfully!');

    // 5. Check notifications again
    const updatedNotifications = await Notification.find({ user: customerId });
    console.log(`\n📋 Updated notifications for customer:`, updatedNotifications.length);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugNotifications();
