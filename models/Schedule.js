const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus is required']
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    trim: true
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true
  },
  departureTime: {
    type: Date,
    required: [true, 'Departure time is required']
  },
  fare: {
    type: Number,
    required: [true, 'Fare is required'],
    min: [0, 'Fare must be a positive number']
  },
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
scheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Schedule', scheduleSchema);
