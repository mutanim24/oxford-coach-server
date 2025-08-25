const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  operator: {
    type: String,
    required: [true, 'Operator is required'],
    trim: true
  },
  busType: {
    type: String,
    required: [true, 'Bus type is required'],
    enum: ['AC', 'Non-AC']
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'Total seats must be at least 1']
  },
  amenities: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
busSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Bus', busSchema);
