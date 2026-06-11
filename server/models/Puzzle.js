const mongoose = require('mongoose');

const puzzleSchema = new mongoose.Schema({
  puzzleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fen: {
    type: String,
    required: true,
    index: true
  },
  solution: [{
    type: String,
    required: true
  }],
  rating: {
    type: Number,
    required: true,
    min: 200,
    max: 3500,
    index: true
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  nbPlays: {
    type: Number,
    default: 0
  },
  themes: [{
    type: String,
    index: true
  }],
  openingTags: [{
    type: String,
    index: true
  }],
  openingFamily: {
    type: String
  },
  source: {
    type: String,
    enum: ['lichess', 'chesscom', 'coach', 'generated'],
    default: 'lichess',
    index: true
  },
  initialPly: {
    type: Number,
    default: 0
  },
  playerSide: {
    type: String,
    enum: ['w', 'b'],
    default: 'w'
  },
  gameUrl: String,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  solvedCount: {
    type: Number,
    default: 0
  },
  avgSolveTime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

puzzleSchema.index({ rating: 1, themes: 1 });
puzzleSchema.index({ openingTags: 1, rating: 1 });
puzzleSchema.index({ source: 1, isActive: 1 });
puzzleSchema.index({ popularity: -1, rating: 1 });
puzzleSchema.index({ puzzleId: 1, source: 1 }, { unique: true });

puzzleSchema.statics.getRandom = function (filter = {}) {
  return this.aggregate([
    { $match: { isActive: true, ...filter } },
    { $sample: { size: 1 } },
    { $limit: 1 }
  ]).then(r => r[0] || null);
};

puzzleSchema.statics.getByTheme = function (theme, limit = 20) {
  return this.find({ isActive: true, themes: theme })
    .sort({ rating: 1 })
    .limit(limit)
    .lean();
};

puzzleSchema.statics.getByRatingRange = function (min, max, limit = 20) {
  return this.find({ isActive: true, rating: { $gte: min, $lte: max } })
    .sort({ popularity: -1 })
    .limit(limit)
    .lean();
};

puzzleSchema.statics.getRecommended = function (profile, limit = 10) {
  const targetRating = profile?.puzzleRating || 1200;
  const weakThemes = profile?.weakThemes || [];
  const range = 200;

  const match = { isActive: true };
  if (weakThemes.length > 0) {
    match.themes = { $in: weakThemes };
  }
  match.rating = { $gte: Math.max(200, targetRating - range), $lte: Math.min(3500, targetRating + range) };

  return this.find(match)
    .sort({ popularity: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('Puzzle', puzzleSchema);
