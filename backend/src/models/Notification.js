const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  type: {
    type: String,
    enum: ['booking_pending', 'booking_confirmed', 'booking_cancelled', 'booking_reminder', 'payment_completed', 'deposit_confirmed', 'deposit_pending_approval'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
