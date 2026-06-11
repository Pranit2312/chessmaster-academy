const mongoose = require('mongoose');

const puzzleRushSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mode: {
    type: String,
    enum: ['3min', '5min', 'survival'],
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  correctCount: {
    type: Number,
    default: 0
  },
  incorrectCount: {
    type: Number,
    default: 0
  },
  totalPuzzles: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  puzzles: [{
    puzzle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Puzzle'
    },
    puzzleId: String,
    correct: Boolean,
    time: Number,
    fen: String,
    solution: [String],
    userMove: String
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  timeLimitSeconds: {
    type: Number,
    default: 180
  },
  remainingSeconds: Number
});

puzzleRushSchema.index({ user: 1, startedAt: -1 });
puzzleRushSchema.index({ mode: 1, score: -1 });

puzzleRushSchema.methods.addPuzzle = function (puzzleObj, correct, time, userMove) {
  const existing = this.puzzles.find(p => p.puzzleId === puzzleObj.puzzleId);
  if (existing) return false;

  this.puzzles.push({
    puzzle: puzzleObj._id,
    puzzleId: puzzleObj.puzzleId,
    correct,
    time,
    fen: puzzleObj.fen,
    solution: puzzleObj.solution,
    userMove
  });

  this.totalPuzzles += 1;
  if (correct) {
    this.correctCount += 1;
    this.score += this.calculatePoints(puzzleObj.rating);
  } else {
    this.incorrectCount += 1;
  }

  this.accuracy = this.totalPuzzles > 0
    ? Math.round((this.correctCount / this.totalPuzzles) * 100)
    : 0;

  return true;
};

puzzleRushSchema.methods.calculatePoints = function (puzzleRating) {
  const base = 10;
  const bonus = Math.floor((puzzleRating - 800) / 100) * 2;
  return Math.max(5, base + bonus);
};

module.exports = mongoose.model('PuzzleRush', puzzleRushSchema);
