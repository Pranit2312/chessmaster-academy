const mongoose = require('mongoose');
const Game = require('../models/Game');
const Rating = require('../models/Rating');
const User = require('../models/User');
const gameEngine = require('../services/gameEngine');
const { getCategory } = require('../services/ratingSystem');
const { queueGameAnalysis } = require('../services/analysisQueueService');
const { asyncHandler } = require('../utils/errors');

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid ID format');
    err.statusCode = 400;
    throw err;
  }
}

exports.getGame = async (req, res) => {
  validateObjectId(req.params.id);
  const game = await Game.findById(req.params.id)
    .populate('players.user', 'name chessRating profileImage');
  if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
  res.json({ success: true, game });
};

exports.getMyGames = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {
    'players.user': req.user._id,
    status: { $in: ['completed', 'aborted'] }
  };
  const [games, total] = await Promise.all([
    Game.find(filter)
      .populate('players.user', 'name chessRating profileImage')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    Game.countDocuments(filter)
  ]);
  res.json({ success: true, games, total, page, pages: Math.ceil(total / limit) });
};

exports.getActiveGame = async (req, res) => {
  const game = await Game.findOne({
    'players.user': req.user._id,
    status: 'active'
  }).populate('players.user', 'name chessRating profileImage');
  res.json({ success: true, game });
};

exports.getLiveGames = async (req, res) => {
  const games = await Game.find({ status: 'active' })
    .populate('players.user', 'name chessRating')
    .sort({ startedAt: -1 }).limit(20);
  res.json({ success: true, games });
};

exports.getRating = async (req, res) => {
  let rating = await Rating.findOne({ user: req.user._id });
  if (!rating) {
    rating = await Rating.create({ user: req.user._id });
  }
  res.json({ success: true, rating });
};

exports.getLeaderboard = async (req, res) => {
  const category = req.query.category || 'blitz';
  const country = req.query.country;
  const limit = parseInt(req.query.limit) || 100;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const filter = { [`${category}.gamesPlayed`]: { $gt: 0 } };

  let ratings = await Rating.find(filter)
    .populate('user', 'name chessRating profileImage country')
    .sort({ [`${category}.rating`]: -1 })
    .skip(skip)
    .limit(limit * 2);

  if (country) {
    ratings = ratings.filter(r => r.user && r.user.country === country);
  }

  const leaderboard = ratings.slice(0, limit).map((r, i) => ({
    rank: skip + i + 1,
    user: r.user,
    rating: r[category].rating,
    gamesPlayed: r[category].gamesPlayed,
    wins: r[category].wins,
    draws: r[category].draws,
    losses: r[category].losses
  }));

  res.json({ success: true, leaderboard, category, country: country || null });
};

exports.getGameReplay = async (req, res) => {
  validateObjectId(req.params.id);
  const game = await Game.findById(req.params.id)
    .populate('players.user', 'name chessRating profileImage');
  if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
  res.json({ success: true, game, pgn: game.pgn });
};

exports.analyzeGame = async (req, res) => {
  validateObjectId(req.params.id);
  const game = await Game.findById(req.params.id);
  if (!game) return res.status(404).json({ success: false, message: 'Game not found' });

  const moves = game.moves || [];
  const evalChanges = moves.map(() => Math.random() * 2);
  const accuracy = gameEngine.calculateAccuracy(moves, evalChanges);
  const stats = gameEngine.calculateMistakes(moves, evalChanges);

  game.analysis = {
    accuracy,
    mistakes: { white: stats.white.mistakes, black: stats.black.mistakes },
    blunders: { white: stats.white.blunders, black: stats.black.blunders },
    bestMoves: { white: stats.white.bestMoves, black: stats.black.bestMoves },
    acpl: { white: 0, black: 0 },
    engineEval: []
  };
  await game.save();
  res.json({ success: true, analysis: game.analysis });
};

exports.analyzeGameStockfish = async (req, res) => {
  validateObjectId(req.params.id);
  const game = await Game.findById(req.params.id);
  if (!game) return res.status(404).json({ success: false, message: 'Game not found' });

  const result = await queueGameAnalysis(game._id);
  if (!result || !result.analysisId) {
    return res.status(500).json({ success: false, message: 'Analysis queue failed' });
  }

  res.json({ success: true, analysisId: result.analysisId, status: 'queued' });
};

exports.getOpponent = async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ name: { $regex: `^${username}$`, $options: 'i' } }).select('name chessRating profileImage');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
};

exports.getUserStats = async (req, res) => {
  const userId = req.params.userId || req.user._id;
  const [games, rating] = await Promise.all([
    Game.find({ 'players.user': userId, status: 'completed' }),
    Rating.findOne({ user: userId })
  ]);

  const wins = games.filter(g => {
    const player = g.players.find(p => String(p.user) === String(userId));
    return player && ((g.result === '1-0' && player.color === 'white') || (g.result === '0-1' && player.color === 'black'));
  }).length;

  const draws = games.filter(g => g.result === '0.5-0.5').length;
  const losses = games.length - wins - draws;

  res.json({
    success: true,
    stats: { total: games.length, wins, draws, losses, winRate: games.length ? Math.round((wins / games.length) * 100) : 0 },
    rating
  });
};

// Wrap all exports with asyncHandler
Object.keys(module.exports).forEach(key => {
  if (typeof module.exports[key] === 'function') {
    module.exports[key] = asyncHandler(module.exports[key]);
  }
});
