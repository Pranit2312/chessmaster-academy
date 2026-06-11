const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  players: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    color: { type: String, enum: ['white', 'black'], required: true },
    ratingBefore: { type: Number, default: 1200 },
    ratingAfter: { type: Number, default: 1200 },
    ratingChange: { type: Number, default: 0 }
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'aborted', 'resigned', 'draw_offered', 'draw_accepted', 'draw_declined'],
    default: 'pending'
  },
  result: {
    type: String,
    enum: ['1-0', '0-1', '0.5-0.5', '*', null],
    default: null
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  termination: {
    type: String,
    enum: ['checkmate', 'resignation', 'timeout', 'draw', 'agreement', 'stalemate', 'insufficient_material', 'threefold_repetition', 'fifty_moves', 'abandoned', 'aborted'],
    default: null
  },
  timeControl: {
    initial: { type: Number, required: true },
    increment: { type: Number, default: 0 }
  },
  timeControlLabel: { type: String },
  clocks: {
    white: { type: Number, default: 0 },
    black: { type: Number, default: 0 },
    lastMoveAt: { type: Date }
  },
  fen: { type: String, default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
  pgn: { type: String, default: '' },
  moves: [{
    moveNumber: Number,
    san: String,
    uci: String,
    fen: String,
    clock: { type: Number },
    elapsed: { type: Number },
    playerColor: { type: String, enum: ['w', 'b'] },
    timestamp: { type: Date, default: Date.now }
  }],
  moveTimes: [{ type: Number }],
  initialFen: { type: String, default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
  rated: { type: Boolean, default: true },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', default: null },
  tournamentRound: { type: Number },
  matchIndex: { type: Number },
  drawOfferedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  startedAt: { type: Date },
  completedAt: { type: Date },
  analysis: {
    accuracy: { white: { type: Number }, black: { type: Number } },
    mistakes: { white: { type: Number }, black: { type: Number } },
    blunders: { white: { type: Number }, black: { type: Number } },
    bestMoves: { white: { type: Number }, black: { type: Number } },
    acpl: { white: { type: Number }, black: { type: Number } },
    engineEval: [{
      fen: String,
      eval: Number,
      bestMove: String,
      depth: Number
    }]
  }
}, { timestamps: true });

gameSchema.index({ 'players.user': 1, createdAt: -1 });
gameSchema.index({ status: 1, createdAt: -1 });
gameSchema.index({ tournament: 1 });

module.exports = mongoose.model('Game', gameSchema);
