const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: [true, 'Schedule is required']
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus is required']
  },
  selectedSeats: [{
    type: String,
    required: [true, 'Selected seats are required']
  }],
  totalFare: {
    type: Number,
    required: [true, 'Total fare is required'],
    min: [0, 'Total fare must be at least 0']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  pnrNumber: {
    type: String,
    required: [true, 'PNR number is required'],
    unique: true
  },
  paymentId: {
    type: String,
    required: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// =================================================================
// THE FIX:
// The problematic compound index has been removed from here.
// The check for duplicate seats should be handled in the booking
// controller logic before creating a new booking, not at the
// database level with this type of index.
//
// REMOVED LINE:
// bookingSchema.index({ schedule: 1, selectedSeats: 1 }, { unique: true });
// =================================================================

module.exports = mongoose.model('BookingV2', bookingSchema);
