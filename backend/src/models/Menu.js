const mongoose = require('mongoose');

const MenuIngredientSchema = new mongoose.Schema({
  ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  ingredientName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true }
}, { _id: false });

const MenuSchema = new mongoose.Schema({
  // Sử dụng _id là chuỗi 5 ký tự số
  _id: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  note: { type: String },
  available: { type: Boolean, default: true },
  ingredients: { type: [MenuIngredientSchema], default: [] },
  category: { type: String, enum: ['coffee', 'tea', 'juice', 'food', 'dessert', 'other'], default: 'other' }
});

// Dùng collection 'menus' (đúng với tên bạn đang sử dụng)
module.exports = mongoose.model('Menu', MenuSchema, 'menus');
