const mongoose = require('mongoose');
const crypto = require('crypto');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, maxlength: 5000 },
  banner: { type: String, default: '' },
  tournamentType: {
    type: String,
    enum: ['arena', 'swiss', 'round_robin'],
    required: true
  },
  timeControl: {
    initial: { type: Number, required: true },
    increment: { type: Number, default: 0 }
  },
  timeControlLabel: { type: String },
  duration: { type: Number, required: true },
  maxPlayers: { type: Number, min: 2, max: 100000, default: 100 },
  registeredPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  registeredCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'],
    default: 'registration_open'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  inviteCode: { type: String },
  allowSpectators: { type: Boolean, default: true },
  allowLateJoin: { type: Boolean, default: false },
  ratingRestriction: {
    min: { type: Number, default: null },
    max: { type: Number, default: null }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rules: { type: String, maxlength: 5000 },
  isRated: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  currentRound: { type: Number, default: 0 },
  totalRounds: { type: Number },
  pairings: [{
    round: Number,
    matches: [{
      player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      result: { type: String, enum: ['1-0', '0-1', '0.5-0.5', '*', null], default: null },
      status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'bye'], default: 'scheduled' },
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' }
    }]
  }],
  standings: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    tieBreak: { type: Number, default: 0 }
  }]
}, { timestamps: true });

tournamentSchema.index({ status: 1, startDate: -1 });
tournamentSchema.index({ createdBy: 1, status: 1 });
tournamentSchema.index({ visibility: 1, status: 1 });
tournamentSchema.index({ inviteCode: 1 }, { sparse: true });

tournamentSchema.pre('save', function() {
  if (this.isModified('visibility') && this.visibility === 'private' && !this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
});

module.exports = mongoose.model('Tournament', tournamentSchema);