const mongoose = require('mongoose');

const coachPuzzleSchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fen: {
    type: String,
    required: true
  },
  solution: [{
    type: String,
    required: true
  }],
  explanation: {
    type: String,
    maxlength: 2000
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  theme: {
    type: String,
    default: 'custom'
  },
  tags: [String],
  courseLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  lessonLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  saves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  saveCount: {
    type: Number,
    default: 0
  },
  solveCount: {
    type: Number,
    default: 0
  },
  correctSolveCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

coachPuzzleSchema.index({ coach: 1, isActive: -1 });
coachPuzzleSchema.index({ difficulty: 1, theme: 1 });
coachPuzzleSchema.index({ likeCount: -1 });

module.exports = mongoose.model('CoachPuzzle', coachPuzzleSchema);
