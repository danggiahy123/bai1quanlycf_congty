const mongoose = require('mongoose');

const transactionHistorySchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  tableId: {
    type: String,
    required: true
  },
  tableName: {
    type: String,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  customerInfo: {
    fullName: String,
    phone: String,
    email: String
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'full_payment', 'order_payment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['qr_code', 'cash', 'card', 'bank_transfer', 'manual', 'manual_confirmation'],
    default: 'qr_code'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  qrCode: {
    type: String,
    required: false
  },
  bankInfo: {
    accountNumber: String,
    accountName: String,
    bankName: String,
    bankCode: String
  },
  transactionId: {
    type: String,
    required: false // ID từ ngân hàng hoặc hệ thống thanh toán
  },
  processedBy: {
    type: String,
    required: false // ID của admin/nhân viên xử lý
  },
  processedByName: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    trim: true
  },
  // Thời gian thanh toán thực tế
  paidAt: {
    type: Date
  },
  // Thời gian xác nhận thanh toán
  confirmedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
transactionHistorySchema.index({ bookingId: 1, createdAt: -1 });
transactionHistorySchema.index({ tableId: 1, createdAt: -1 });
transactionHistorySchema.index({ customerId: 1, createdAt: -1 });
transactionHistorySchema.index({ status: 1, createdAt: -1 });
transactionHistorySchema.index({ transactionType: 1, createdAt: -1 });

module.exports = mongoose.model('TransactionHistory', transactionHistorySchema);
