const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bullet: {
    rating: { type: Number, default: 1200 },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 }
  },
  blitz: {
    rating: { type: Number, default: 1200 },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 }
  },
  rapid: {
    rating: { type: Number, default: 1200 },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 }
  },
  classical: {
    rating: { type: Number, default: 1200 },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 }
  },
  history: [{
    category: { type: String, enum: ['bullet', 'blitz', 'rapid', 'classical'] },
    rating: Number,
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Rating', ratingSchema);
