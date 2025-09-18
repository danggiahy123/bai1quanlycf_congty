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
    tableName: { type: String },
    customerId: { type: String },
    customerName: { type: String },
    status: { type: String, enum: ['pending', 'paid', 'completed'], default: 'pending' },
    items: { type: [OrderItemSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'cash' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema, 'orders');










