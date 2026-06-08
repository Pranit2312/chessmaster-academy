const mongoose = require('mongoose');

const botGameSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fen: {
    type: String,
    default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  },
  pgn: {
    type: String,
    default: ''
  },
  moves: [{
    moveNumber: Number,
    san: String,
    uci: String,
    fen: String,
    by: {
      type: String,
      enum: ['player', 'bot'],
      required: true
    },
    eval: Number,
    clock: Number
  }],
  result: {
    type: String,
    enum: ['playing', 'white_win', 'black_win', 'draw', 'resigned', 'aborted'],
    default: 'playing'
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
    default: 5
  },
  playerColor: {
    type: String,
    enum: ['w', 'b', 'random'],
    default: 'w'
  },
  timeControl: {
    initial: { type: Number, default: 600 },
    increment: { type: Number, default: 5 }
  },
  playerClock: { type: Number, default: 600 },
  botClock: { type: Number, default: 600 },
  lastMoveAt: Date,
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  analysis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockfishAnalysis'
  },
  rating: {
    userRatingBefore: Number,
    userRatingAfter: Number,
    botRating: { type: Number, default: 1500 }
  }
}, { timestamps: true });

botGameSchema.index({ user: 1, startedAt: -1 });
botGameSchema.index({ result: 1 });
botGameSchema.index({ difficulty: 1 });

module.exports = mongoose.model('BotGame', botGameSchema);
