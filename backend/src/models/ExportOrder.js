const mongoose = require('mongoose');

const exportItemSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    enum: ['sale', 'waste', 'damage', 'transfer', 'other'],
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const exportOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [exportItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    enum: ['kitchen', 'bar', 'service', 'admin', 'other'],
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
// orderNumber index is already created by unique: true
exportOrderSchema.index({ status: 1 });
exportOrderSchema.index({ orderDate: -1 });
exportOrderSchema.index({ requestedBy: 1 });
exportOrderSchema.index({ department: 1 });

// Pre-save middleware to generate order number
exportOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `EXP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Method to approve order
exportOrderSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  return this.save();
};

// Method to complete order
exportOrderSchema.methods.complete = function(completedBy) {
  this.status = 'completed';
  this.completedBy = completedBy;
  this.completedDate = new Date();
  return this.save();
};

// Method to cancel order
exportOrderSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

module.exports = mongoose.model('ExportOrder', exportOrderSchema);
