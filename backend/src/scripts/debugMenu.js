const mongoose = require('mongoose');
require('dotenv').config();

async function debugMenu() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check different collection names
    const collectionNames = ['menus', 'menu', 'items'];
    
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`${collectionName}: ${count} documents`);
        
        if (count > 0) {
          const docs = await collection.find().limit(3).toArray();
          console.log(`Sample from ${collectionName}:`, docs);
        }
      } catch (error) {
        console.log(`${collectionName}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugMenu();
