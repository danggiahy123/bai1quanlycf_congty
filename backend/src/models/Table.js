const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema(
  {
    _id: { type: String }, // 5 số giống Menu
    name: { type: String, required: true }, // tên hiển thị (ví dụ: Bàn 1)
    status: { type: String, enum: ['TRỐNG', 'ĐÃ ĐƯỢC ĐẶT'], default: 'TRỐNG' },
    note: { type: String },
  },
  { timestamps: true }
);

// Dùng đúng collection theo yêu cầu: 'slban'
module.exports = mongoose.model('Table', TableSchema, 'ban');


