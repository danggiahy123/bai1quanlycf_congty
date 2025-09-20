const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');

mongoose.connect('mongodb://localhost:27017/cafe_management');

async function checkNotifications() {
  try {
    console.log('Checking notifications...');
    
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Found ${notifications.length} notifications:`);
    notifications.forEach((n, i) => {
      console.log(`${i+1}. [${n.type}] ${n.title}`);
      console.log(`   User: ${n.user || 'General'}`);
      console.log(`   Created: ${n.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkNotifications();
