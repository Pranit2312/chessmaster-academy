const mongoose = require('mongoose');

const aiPuzzleSchema = new mongoose.Schema({
  fen: {
    type: String,
    required: true,
    index: true
  },
  solution: [{
    type: String
  }],
  theme: {
    type: String,
    enum: ['fork', 'pin', 'skewer', 'checkmate', 'sacrifice', 'discovered_attack', 'double_check', 'zwischenzug', 'deflection', 'attraction', 'interference', 'x_ray', 'windmill', 'pawn_breakthrough', 'endgame', 'tactic'],
    default: 'tactic'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  rating: {
    type: Number,
    default: 1000,
    min: 200,
    max: 3500
  },
  source: {
    type: String,
    enum: ['generated', 'from_game', 'manual', 'daily', 'lichess', 'lichess_daily'],
    default: 'generated'
  },
  sourceGame: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockfishAnalysis'
  },
  sourceUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String,
    maxlength: 500
  },
  playerSide: {
    type: String,
    enum: ['w', 'b'],
    default: 'w'
  },
  instructions: {
    type: String,
    default: 'Find the best move'
  },
  hint: String,
  popularity: {
    type: Number,
    default: 0
  },
  timesSolved: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, { timestamps: true });

aiPuzzleSchema.index({ theme: 1, difficulty: 1 });
aiPuzzleSchema.index({ rating: 1 });
aiPuzzleSchema.index({ source: 1, createdAt: -1 });

module.exports = mongoose.model('AiPuzzle', aiPuzzleSchema);
