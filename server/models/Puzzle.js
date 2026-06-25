const mongoose = require('mongoose');

const puzzleSchema = new mongoose.Schema({
  puzzleId: { type: String, required: true, unique: true },
  fen: { type: String, required: true },
  solution: [{ type: String, required: true }],
  rating: { type: Number, required: true, min: 200, max: 3500 },
  ratingDeviation: { type: Number, default: 0, min: 0 },
  popularity: { type: Number, default: 0, min: 0 },
  nbPlays: { type: Number, default: 0 },
  themes: [{ type: String }],
  openingTags: [{ type: String }],
  gameUrl: String,
  playerSide: { type: String, enum: ['w', 'b'], default: 'w' },
  isActive: { type: Boolean, default: true },
  solvedCount: { type: Number, default: 0 },
  avgSolveTime: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes
puzzleSchema.index({ rating: 1 });
puzzleSchema.index({ themes: 1 });
puzzleSchema.index({ popularity: -1 });
puzzleSchema.index({ rating: 1, popularity: -1 });
puzzleSchema.index({ themes: 1, rating: 1 });
puzzleSchema.index({ isActive: 1, rating: 1 });
puzzleSchema.index({ isActive: 1, themes: 1, popularity: -1 });

puzzleSchema.statics.getRandom = function (filter = {}) {
  return this.aggregate([
    { $match: { isActive: true, ...filter } },
    { $sample: { size: 1 } },
    { $limit: 1 }
  ]).then(r => r[0] || null);
};

puzzleSchema.statics.getByTheme = function (theme, limit = 20) {
  return this.find({ isActive: true, themes: theme })
    .sort({ rating: 1 }).limit(limit).lean();
};

puzzleSchema.statics.getByRatingRange = function (min, max, limit = 20) {
  return this.find({ isActive: true, rating: { $gte: min, $lte: max } })
    .sort({ popularity: -1 }).limit(limit).lean();
};

puzzleSchema.statics.searchPuzzles = function (query, limit = 20) {
  const filter = { isActive: true };
  if (query.rating) {
    const range = 100;
    filter.rating = { $gte: Math.max(200, query.rating - range), $lte: Math.min(3500, query.rating + range) };
  }
  if (query.theme) filter.themes = query.theme;
  if (query.minRating) filter.rating = { ...filter.rating, $gte: query.minRating };
  if (query.maxRating) filter.rating = { ...filter.rating, $lte: query.maxRating };
  if (query.popularity) filter.popularity = { $gte: query.popularity };
  return this.find(filter).sort({ popularity: -1, rating: -1 }).limit(limit).lean();
};

puzzleSchema.statics.getRecommended = function (profile, limit = 10) {
  const targetRating = profile?.puzzleRating || 1200;
  const weakThemes = profile?.weakThemes || [];
  const range = 200;
  const match = { isActive: true };
  if (weakThemes.length > 0) match.themes = { $in: weakThemes };
  match.rating = { $gte: Math.max(200, targetRating - range), $lte: Math.min(3500, targetRating + range) };
  return this.find(match).sort({ popularity: -1 }).limit(limit).lean();
};

module.exports = mongoose.model('Puzzle', puzzleSchema);
