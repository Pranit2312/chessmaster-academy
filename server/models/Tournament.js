const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, maxlength: 5000 },
  banner: { type: String },
  tournamentType: {
    type: String,
    enum: ['swiss', 'round_robin', 'knockout', 'double_elimination', 'arena'],
    required: true
  },
  timeControl: {
    initial: { type: Number, required: true },
    increment: { type: Number, default: 0 }
  },
  timeControlLabel: { type: String },
  entryFee: { type: Number, default: 0 },
  prizePool: { type: Number, default: 0 },
  maxPlayers: { type: Number, min: 2, max: 10000, default: 100 },
  registeredPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  registeredCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rules: { type: String, maxlength: 5000 },
  isRated: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },
  currentRound: { type: Number, default: 0 },
  totalRounds: { type: Number },
  pairings: [{
    round: Number,
    matches: [{
      player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      result: { type: String, enum: ['1-0', '0-1', '0.5-0.5', '*', null], default: null },
      status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'bye'], default: 'scheduled' }
    }]
  }],
  standings: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    tieBreak: { type: Number, default: 0 }
  }],
  prizes: [{
    position: { type: Number },
    amount: { type: Number },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

tournamentSchema.index({ status: 1, startDate: -1 });
tournamentSchema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model('Tournament', tournamentSchema);
