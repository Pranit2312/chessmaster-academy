const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['first_booking', 'first_course', 'first_tournament', 'tournament_winner', 'puzzle_master', 'coach_favorite', 'streak_7', 'streak_30', 'sessions_100', 'puzzle_1000'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  unlockedAt: { type: Date, default: Date.now }
});

achievementSchema.index({ user: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
