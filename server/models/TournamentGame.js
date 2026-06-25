const mongoose = require('mongoose');

const tournamentGameSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  round: { type: Number, required: true },
  white: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  black: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  result: { type: String, enum: ['1-0', '0-1', '0.5-0.5', '*', null], default: null },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'bye'], default: 'scheduled' },
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  boardIndex: { type: Number, default: 0 },
  pairingIndex: { type: Number },
  table: { type: Number }
}, { timestamps: true });

tournamentGameSchema.index({ tournament: 1, round: 1 });
tournamentGameSchema.index({ tournament: 1, white: 1 });
tournamentGameSchema.index({ tournament: 1, black: 1 });
tournamentGameSchema.index({ game: 1 }, { sparse: true });

module.exports = mongoose.model('TournamentGame', tournamentGameSchema);