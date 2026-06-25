const mongoose = require('mongoose');

const tournamentParticipantSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['registered', 'active', 'eliminated', 'withdrawn'], default: 'registered' },
  seed: { type: Number },
  points: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  tieBreak: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

tournamentParticipantSchema.index({ tournament: 1, user: 1 }, { unique: true });
tournamentParticipantSchema.index({ tournament: 1, points: -1 });

module.exports = mongoose.model('TournamentParticipant', tournamentParticipantSchema);