const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema(
  {
    _id: { type: String }, // 5 số giống Menu
    name: { type: String, required: true }, // tên hiển thị (ví dụ: Bàn 1)
    status: { type: String, enum: ['empty', 'occupied'], default: 'empty' },
    note: { type: String },
    // Tính năng nâng cao
    capacity: { type: Number, required: true }, // Số người tối đa
    location: { 
      type: String, 
      enum: ['window', 'air_conditioned', 'outdoor', 'private_room', 'main_hall'],
      required: true 
    }, // Vị trí bàn
    features: [{
      type: String,
      enum: ['wifi', 'power_outlet', 'quiet', 'romantic', 'business', 'family_friendly', 'wheelchair_accessible']
    }], // Các tính năng đặc biệt
    price: { type: Number, default: 0 }, // Phí đặt bàn (nếu có)
    description: { type: String }, // Mô tả chi tiết
    image: { type: String }, // Hình ảnh bàn
    isPremium: { type: Boolean, default: false }, // Bàn VIP
  },
  { timestamps: true }
);

// Dùng đúng collection theo yêu cầu: 'slban'
module.exports = mongoose.model('Table', TableSchema, 'ban');


