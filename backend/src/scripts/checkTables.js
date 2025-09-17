const mongoose = require('mongoose');
require('dotenv').config();

const TableSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['TRỐNG', 'ĐÃ ĐƯỢC ĐẶT'], default: 'TRỐNG' }
});

const Table = mongoose.model('Table', TableSchema, 'tables');

async function checkTables() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    const tables = await Table.find();
    console.log('\n🪑 Tables found:', tables.length);
    
    if (tables.length === 0) {
      console.log('No tables found. Creating test tables...');
      
      const testTables = [
        { _id: '30001', name: 'Bàn 1', capacity: 4, status: 'TRỐNG' },
        { _id: '30002', name: 'Bàn 2', capacity: 2, status: 'TRỐNG' },
        { _id: '30003', name: 'Bàn 3', capacity: 6, status: 'TRỐNG' },
        { _id: '30004', name: 'Bàn 4', capacity: 4, status: 'TRỐNG' },
        { _id: '30005', name: 'Bàn 5', capacity: 8, status: 'TRỐNG' }
      ];
      
      for (const table of testTables) {
        const newTable = new Table(table);
        await newTable.save();
        console.log(`✅ Created: ${table.name} (${table.capacity} người)`);
      }
    } else {
      tables.forEach(t => {
        console.log(`- ${t.name} (${t.capacity} người) - ${t.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkTables();
