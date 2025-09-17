const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['import', 'export', 'adjustment', 'waste', 'damage', 'transfer'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  previousStock: {
    type: Number,
    required: true,
    min: 0
  },
  newStock: {
    type: Number,
    required: true,
    min: 0
  },
  reference: {
    type: String, // Order number or reference
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // ID of the order
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  performedByName: {
    type: String,
    required: false
  },
  reason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  department: {
    type: String,
    enum: ['kitchen', 'bar', 'service', 'admin', 'warehouse', 'other']
  }
}, {
  timestamps: true
});

// Indexes
inventoryTransactionSchema.index({ ingredient: 1, createdAt: -1 });
inventoryTransactionSchema.index({ transactionType: 1 });
inventoryTransactionSchema.index({ reference: 1 });
inventoryTransactionSchema.index({ performedBy: 1 });
inventoryTransactionSchema.index({ createdAt: -1 });

// Static method to create transaction
inventoryTransactionSchema.statics.createTransaction = async function(data) {
  const transaction = new this(data);
  await transaction.save();
  
  // Update ingredient stock
  const ingredient = await this.model('Ingredient').findById(data.ingredient);
  if (ingredient) {
    if (data.transactionType === 'import' || data.transactionType === 'adjustment') {
      ingredient.currentStock += data.quantity;
    } else {
      ingredient.currentStock = Math.max(0, ingredient.currentStock - data.quantity);
    }
    await ingredient.save();
  }
  
  return transaction;
};

// Static method to get stock history
inventoryTransactionSchema.statics.getStockHistory = function(ingredientId, startDate, endDate) {
  const query = { ingredient: ingredientId };
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.find(query)
    .populate('ingredient', 'name unit')
    .populate('performedBy', 'fullName')
    .sort({ createdAt: -1 });
};

// Static method to get low stock items
inventoryTransactionSchema.statics.getLowStockItems = function() {
  return this.model('Ingredient').find({
    currentStock: { $lte: { $expr: '$minStockLevel' } },
    isActive: true
  }).sort({ currentStock: 1 });
};

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
