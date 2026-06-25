const mongoose = require('mongoose');

const tournamentRoundSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  roundNumber: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TournamentGame' }]
}, { timestamps: true });

tournamentRoundSchema.index({ tournament: 1, roundNumber: 1 });

module.exports = mongoose.model('TournamentRound', tournamentRoundSchema);