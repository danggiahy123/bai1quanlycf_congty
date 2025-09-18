const mongoose = require('mongoose');

const stockCheckSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  previousStock: {
    type: Number,
    required: true,
    default: 0
  },
  newStock: {
    type: Number,
    required: true,
    default: 0
  },
  difference: {
    type: Number,
    required: true,
    default: 0
  },
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkedByName: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  checkDate: {
    type: Date,
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
stockCheckSchema.index({ ingredient: 1, checkDate: -1 });
stockCheckSchema.index({ checkDate: -1 });

module.exports = mongoose.model('StockCheck', stockCheckSchema);
