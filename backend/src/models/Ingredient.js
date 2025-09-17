const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['coffee', 'milk', 'syrup', 'topping', 'food', 'beverage', 'other'],
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'bag', 'bottle', 'can']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    name: String,
    contact: String,
    address: String,
    phone: String,
    email: String
  },
  minStockLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  maxStockLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 1000
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
// name index is already created by unique: true
ingredientSchema.index({ category: 1 });
ingredientSchema.index({ isActive: 1 });
ingredientSchema.index({ currentStock: 1 });

// Virtual for stock status
ingredientSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= this.minStockLevel) {
    return 'low';
  } else if (this.currentStock >= this.maxStockLevel) {
    return 'high';
  }
  return 'normal';
});

// Virtual for stock value
ingredientSchema.virtual('stockValue').get(function() {
  return this.currentStock * this.unitPrice;
});

// Method to check if stock is low
ingredientSchema.methods.isLowStock = function() {
  return this.currentStock <= this.minStockLevel;
};

// Method to check if stock is high
ingredientSchema.methods.isHighStock = function() {
  return this.currentStock >= this.maxStockLevel;
};

// Method to update stock
ingredientSchema.methods.updateStock = function(quantity, operation = 'add') {
  if (operation === 'add') {
    this.currentStock += quantity;
  } else if (operation === 'subtract') {
    this.currentStock = Math.max(0, this.currentStock - quantity);
  }
  return this.save();
};

module.exports = mongoose.model('Ingredient', ingredientSchema);
