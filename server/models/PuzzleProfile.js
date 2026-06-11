const mongoose = require('mongoose');

const puzzleProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  puzzleRating: {
    type: Number,
    default: 1200,
    min: 200,
    max: 3500
  },
  solvedCount: {
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
  accuracy: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  bestStreak: {
    type: Number,
    default: 0
  },
  totalSolveTime: {
    type: Number,
    default: 0
  },
  averageSolveTime: {
    type: Number,
    default: 0
  },
  puzzleHistory: [{
    puzzle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Puzzle'
    },
    puzzleId: String,
    correct: Boolean,
    time: Number,
    rating: Number,
    theme: String,
    solvedAt: {
      type: Date,
      default: Date.now
    }
  }],
  themeStats: {
    type: Map,
    of: new mongoose.Schema({
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      rating: { type: Number, default: 1200 }
    }, { _id: false }),
    default: {}
  },
  weakThemes: [String],
  strongThemes: [String],
  dailyPuzzleSolved: {
    type: Boolean,
    default: false
  },
  lastDailyDate: String,
  rushBestScore: {
    type: Number,
    default: 0
  },
  rushBestAccuracy: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

puzzleProfileSchema.methods.recordSolve = function (puzzleObj, correct, timeMs) {
  this.solvedCount += 1;
  if (correct) {
    this.correctCount += 1;
    this.currentStreak += 1;
    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
    }
  } else {
    this.incorrectCount += 1;
    this.currentStreak = 0;
  }

  this.accuracy = this.solvedCount > 0
    ? Math.round((this.correctCount / this.solvedCount) * 100)
    : 0;

  this.totalSolveTime += timeMs;
  this.averageSolveTime = this.solvedCount > 0
    ? Math.round(this.totalSolveTime / this.solvedCount)
    : 0;

  const theme = puzzleObj.themes?.[0] || 'tactic';
  const key = theme;
  const existing = this.themeStats.get(key) || { attempted: 0, correct: 0, rating: 1200 };
  existing.attempted += 1;
  if (correct) existing.correct += 1;
  this.themeStats.set(key, existing);

  this.puzzleHistory.push({
    puzzle: puzzleObj._id,
    puzzleId: puzzleObj.puzzleId,
    correct,
    time: timeMs,
    rating: puzzleObj.rating,
    theme,
    solvedAt: new Date()
  });

  if (this.puzzleHistory.length > 200) {
    this.puzzleHistory = this.puzzleHistory.slice(-200);
  }

  this.updateWeakStrongThemes();
  this.lastActive = new Date();
};

puzzleProfileSchema.methods.updateWeakStrongThemes = function () {
  const weak = [];
  const strong = [];

  for (const [theme, stats] of this.themeStats) {
    const accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
    if (accuracy < 50 && stats.attempted >= 3) {
      weak.push(theme);
    } else if (accuracy >= 75 && stats.attempted >= 3) {
      strong.push(theme);
    }
  }

  this.weakThemes = weak;
  this.strongThemes = strong;
};

module.exports = mongoose.model('PuzzleProfile', puzzleProfileSchema);
