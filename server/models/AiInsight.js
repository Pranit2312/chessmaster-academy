const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['weakness', 'strength', 'recommendation', 'milestone', 'trend', 'skill_assessment'],
    required: true
  },
  category: {
    type: String,
    enum: ['opening', 'tactics', 'endgame', 'strategy', 'middlegame', 'calculation', 'positional', 'general'],
    default: 'general'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  severity: {
    type: String,
    enum: ['critical', 'major', 'moderate', 'minor', 'positive'],
    default: 'moderate'
  },
  metric: {
    type: String,
    enum: ['accuracy', 'tactical_accuracy', 'opening_performance', 'endgame_performance', 'blunder_rate', 'mistake_rate', 'centipawn_loss', 'rating_progress', 'puzzle_score', 'course_progress'],
    default: 'accuracy'
  },
  value: Number,
  trend: {
    type: String,
    enum: ['improving', 'declining', 'stable', 'new'],
    default: 'new'
  },
  relatedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  relatedCoach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedAnalysis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockfishAnalysis'
  },
  actionUrl: String,
  actionLabel: String,
  isRead: {
    type: Boolean,
    default: false
  },
  isDismissed: {
    type: Boolean,
    default: false
  },
  expiresAt: Date,
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

aiInsightSchema.index({ user: 1, generatedAt: -1 });
aiInsightSchema.index({ user: 1, type: 1, isRead: 1 });
aiInsightSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('AiInsight', aiInsightSchema);
