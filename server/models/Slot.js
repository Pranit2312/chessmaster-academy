const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 60 // in minutes
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  meetingLink: {
    type: String,
    required: true
  },
  meetingPlatform: {
    type: String,
    enum: ['Zoom', 'Google Meet', 'Microsoft Teams', 'Other'],
    default: 'Zoom'
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'completed', 'expired', 'cancelled'],
    default: 'available'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
slotSchema.index({ coach: 1, startTime: 1 });
slotSchema.index({ status: 1, startTime: 1 });

module.exports = mongoose.model('Slot', slotSchema);