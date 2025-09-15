const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
  // Sử dụng _id là chuỗi 5 ký tự số
  _id: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  note: { type: String },
  // Chấp nhận gửi 'size' là chuỗi hoặc mảng, tự ép về mảng
  size: {
    type: [String],
    enum: ['S', 'M', 'L'],
    default: ['M'],
    set: (value) => {
      if (Array.isArray(value)) return value;
      if (value === undefined || value === null || value === '') return [];
      return [value];
    },
  },
  available: { type: Boolean, default: true }
});

// Dùng collection 'menus' (đúng với tên bạn đang sử dụng)
module.exports = mongoose.model('Menu', MenuSchema, 'menus');
