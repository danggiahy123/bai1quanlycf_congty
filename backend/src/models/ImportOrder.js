const mongoose = require('mongoose');

const importItemSchema = new mongoose.Schema({
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
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String
  }
}, { _id: false });

const importOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    name: {
      type: String,
      required: true
    },
    contact: String,
    address: String,
    phone: String,
    email: String
  },
  items: [importItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'received', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  notes: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'check']
  },
  paymentDate: {
    type: Date
  },
  invoiceNumber: {
    type: String
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
// orderNumber index is already created by unique: true
importOrderSchema.index({ status: 1 });
importOrderSchema.index({ orderDate: -1 });
importOrderSchema.index({ supplier: 1 });

// Pre-save middleware to generate order number
importOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `IMP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate final amount
importOrderSchema.pre('save', function(next) {
  this.finalAmount = this.totalAmount - this.discount + this.tax;
  next();
});

// Method to approve order
importOrderSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  return this.save();
};

// Method to receive order
importOrderSchema.methods.receive = function(receivedBy) {
  this.status = 'received';
  this.receivedBy = receivedBy;
  this.actualDeliveryDate = new Date();
  return this.save();
};

// Method to cancel order
importOrderSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

module.exports = mongoose.model('ImportOrder', importOrderSchema);
