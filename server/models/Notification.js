const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['tournament_created', 'registration_success', 'tournament_starting', 'round_started', 'result_submitted', 'prize_won', 'withdrawal_approved', 'withdrawal_rejected', 'course_approved', 'course_rejected', 'coach_verified', 'coach_rejected', 'booking_confirmed', 'session_reminder', 'achievement_unlocked'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
