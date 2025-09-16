const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    menuId: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    tableId: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    items: { type: [OrderItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema, 'orders');





