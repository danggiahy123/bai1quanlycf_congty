const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false // Cho phép null cho admin quick booking
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: false // Cho phép null cho admin quick booking
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  bookingDate: {
    type: Date,
    required: true
  },
  bookingTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  menuItems: [{
    item: {
      type: String,
      ref: 'Menu',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    size: {
      type: String,
      default: 'M'
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: false // Cho phép null cho admin quick booking
  },
  depositAmount: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  confirmedBy: {
    type: String,
    ref: 'Employee'
  },
  confirmedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  customerInfo: {
    fullName: String,
    phone: String,
    email: String
  }
}, {
  timestamps: true
});

// Index for better query performance
bookingSchema.index({ bookingDate: 1, table: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
