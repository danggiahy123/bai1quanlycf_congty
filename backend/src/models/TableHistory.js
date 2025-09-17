const mongoose = require('mongoose');

const TableHistorySchema = new mongoose.Schema(
  {
    tableId: { type: String, required: true },
    tableName: { type: String, required: true },
    action: { 
      type: String, 
      enum: ['OCCUPIED', 'FREED', 'PAID'], 
      required: true 
    },
    performedBy: { 
      type: String, 
      required: true 
    },
    performedByName: { type: String, required: true },
    customerName: { type: String },
    bookingId: { type: String },
    amount: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TableHistory', TableHistorySchema);


