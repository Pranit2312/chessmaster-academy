const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Game = require('../models/Game');
const pairingEngine = require('../services/pairingEngine');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

// Store io instance for socket notifications
let _io = null;
exports.setIO = (io) => { _io = io; };

exports.create = async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };
  if (data.timeControl) {
    data.timeControlLabel = `${data.timeControl.initial}+${data.timeControl.increment}`;
  }
  const tournament = await Tournament.create(data);
  res.status(201).json({ success: true, tournament });
};

exports.getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.tournamentType = req.query.type;
  if (req.query.isPublic !== undefined) filter.isPublic = req.query.isPublic === 'true';
  const [tournaments, total] = await Promise.all([
    Tournament.find(filter).populate('createdBy', 'name').sort({ startDate: -1 }).skip(skip).limit(limit),
    Tournament.countDocuments(filter)
  ]);
  res.json({ success: true, tournaments, total, page, pages: Math.ceil(total / limit) });
};

exports.getActive = async (req, res) => {
  const tournaments = await Tournament.find({
    status: { $in: ['registration_open', 'in_progress'] }
  }).populate('createdBy', 'name').sort({ startDate: 1 });
  res.json({ success: true, tournaments });
};

exports.getById = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('registeredPlayers', 'name chessRating profileImage')
    .populate('standings.player', 'name chessRating profileImage');
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  res.json({ success: true, tournament });
};

exports.update = async (req, res) => {
  const allowed = ['name', 'description', 'banner', 'entryFee', 'prizePool', 'maxPlayers', 'startDate', 'endDate', 'registrationDeadline', 'rules', 'isRated', 'isPublic'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (req.body.timeControl) {
    updates.timeControl = req.body.timeControl;
    updates.timeControlLabel = `${req.body.timeControl.initial}+${req.body.timeControl.increment}`;
  }
  const tournament = await Tournament.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  res.json({ success: true, tournament });
};

exports.remove = async (req, res) => {
  const tournament = await Tournament.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  res.json({ success: true, message: 'Tournament cancelled' });
};

exports.register = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.status !== 'registration_open') return res.status(400).json({ success: false, message: 'Registration is not open' });
  if (tournament.registeredPlayers.includes(req.user._id)) return res.status(400).json({ success: false, message: 'Already registered' });
  if (tournament.registeredCount >= tournament.maxPlayers) return res.status(400).json({ success: false, message: 'Tournament is full' });

  if (tournament.entryFee > 0) {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || (wallet.balance || 0) < tournament.entryFee) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance. Please add funds.' });
    }
    wallet.balance -= tournament.entryFee;
    wallet.escrowBalance = (wallet.escrowBalance || 0) + tournament.entryFee;
    await wallet.save();
    await Transaction.create({
      user: req.user._id,
      amount: tournament.entryFee,
      type: 'debit',
      reason: 'tournament_entry'
    });
  }

  tournament.registeredPlayers.push(req.user._id);
  tournament.registeredCount = tournament.registeredPlayers.length;

  if (!tournament.standings.find(s => s.player.toString() === req.user._id.toString())) {
    tournament.standings.push({
      player: req.user._id,
      points: 0, wins: 0, draws: 0, losses: 0, tieBreak: 0
    });
  }
  await tournament.save();

  await User.findByIdAndUpdate(req.user._id, { $inc: { tournamentsPlayed: 1 } });

  res.json({ success: true, message: 'Registered', tournament });
};

exports.unregister = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.status !== 'registration_open') return res.status(400).json({ success: false, message: 'Cannot unregister now' });
  tournament.registeredPlayers.pull(req.user._id);
  tournament.registeredCount = tournament.registeredPlayers.length;
  tournament.standings = tournament.standings.filter(s => s.player.toString() !== req.user._id.toString());
  if (tournament.entryFee > 0) {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (wallet) {
      wallet.balance = (wallet.balance || 0) + tournament.entryFee;
      wallet.escrowBalance = Math.max(0, (wallet.escrowBalance || 0) - tournament.entryFee);
      await wallet.save();
      await Transaction.create({
        user: req.user._id,
        amount: tournament.entryFee,
        type: 'credit',
        reason: 'tournament_refund'
      });
    }
  }
  await tournament.save();
  res.json({ success: true, message: 'Unregistered' });
};

exports.startTournament = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.status !== 'registration_open' && tournament.status !== 'registration_closed') {
    return res.status(400).json({ success: false, message: 'Cannot start tournament in current state' });
  }

  const players = tournament.standings.map(s => ({
    playerId: s.player,
    points: s.points,
    tieBreak: s.tieBreak
  }));

  let firstRound;
  let totalRounds;

  switch (tournament.tournamentType) {
    case 'swiss':
      totalRounds = tournament.totalRounds || 5;
      firstRound = pairingEngine.generateSwissPairings(players, 1, []);
      break;
    case 'round_robin':
      totalRounds = players.length - 1;
      firstRound = pairingEngine.generateRoundRobinPairings(players, 1);
      break;
    case 'knockout': {
      const bracket = pairingEngine.generateKnockoutBracket(players);
      totalRounds = bracket.size > 0 ? Math.log2(bracket.size) : 1;
      firstRound = bracket.bracket;
      break;
    }
    case 'double_elimination': {
      const bracket = pairingEngine.generateDoubleEliminationBracket(players);
      totalRounds = bracket.size > 0 ? Math.log2(bracket.size) * 2 : 2;
      firstRound = bracket.winnersBracket.map(m => ({ player1: m.player1, player2: m.player2 }));
      break;
    }
    case 'arena':
      totalRounds = 0; // arena is continuous, no fixed rounds
      firstRound = [];
      break;
    default:
      return res.status(400).json({ success: false, message: 'Unsupported tournament type' });
  }

  tournament.totalRounds = totalRounds;
  tournament.currentRound = 1;
  tournament.status = 'in_progress';
  tournament.pairings = [{
    round: 1,
    matches: firstRound.map(m => ({
      player1: m.player1,
      player2: m.player2,
      result: m.player2 ? null : '1-0',
      status: m.player2 ? 'scheduled' : 'bye'
    }))
  }];
  await tournament.save();

  // Auto-create Game documents for the first round
  if (firstRound.length > 0) {
    const roundData = tournament.pairings[0];
    const activeMatches = roundData.matches.filter(m => m.status === 'scheduled' && m.player2);
    await pairingEngine.createGamesForPairings(tournament, activeMatches, _io);
    await tournament.save();
  }

  res.json({ success: true, message: 'Tournament started', tournament });
};

exports.nextRound = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Tournament not in progress' });

  if (tournament.tournamentType === 'arena') {
    return res.status(400).json({ success: false, message: 'Arena tournaments are continuous — no rounds' });
  }

  if (tournament.currentRound >= tournament.totalRounds) {
    return res.status(400).json({ success: false, message: 'All rounds completed' });
  }

  const nextRoundNum = tournament.currentRound + 1;
  const players = tournament.standings.map(s => ({
    playerId: s.player,
    points: s.points,
    tieBreak: s.tieBreak
  }));

  let nextPairings;
  switch (tournament.tournamentType) {
    case 'swiss':
      nextPairings = pairingEngine.generateSwissPairings(players, nextRoundNum, tournament.pairings.map(p => p.matches));
      break;
    case 'round_robin':
      nextPairings = pairingEngine.generateRoundRobinPairings(players, nextRoundNum);
      break;
    case 'knockout': {
      const lastRound = tournament.pairings[tournament.pairings.length - 1];
      const winners = lastRound.matches
        .filter(m => m.result && m.result !== '*')
        .map(m => {
          if (m.result === '1-0') return m.player1;
          if (m.result === '0-1') return m.player2;
          return null;
        })
        .filter(Boolean);
      nextPairings = [];
      for (let i = 0; i < winners.length; i += 2) {
        nextPairings.push({ player1: winners[i], player2: winners[i + 1] || null });
      }
      break;
    }
    case 'double_elimination':
      nextPairings = pairingEngine.generateDoubleEliminationNextRound(tournament);
      break;
    default:
      return res.status(400).json({ success: false, message: 'Unsupported tournament type' });
  }

  if (!nextPairings || nextPairings.length === 0) {
    return res.status(400).json({ success: false, message: 'Could not generate pairings' });
  }

  tournament.currentRound = nextRoundNum;
  tournament.pairings.push({
    round: nextRoundNum,
    matches: nextPairings.map(m => ({
      player1: m.player1,
      player2: m.player2,
      result: m.player2 ? null : '1-0',
      status: m.player2 ? 'scheduled' : 'bye'
    }))
  });
  await tournament.save();

  // Auto-create Game documents for the new round
  const roundData = tournament.pairings[tournament.pairings.length - 1];
  const activeMatches = roundData.matches.filter(m => m.status === 'scheduled' && m.player2);
  await pairingEngine.createGamesForPairings(tournament, activeMatches, _io);
  await tournament.save();

  res.json({ success: true, message: `Round ${nextRoundNum} started`, tournament });
};

// Arena: pair any two available players
exports.arenaPair = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.tournamentType !== 'arena' || tournament.status !== 'in_progress') {
    return res.status(400).json({ success: false, message: 'Not an active arena tournament' });
  }

  const player = tournament.standings.find(s => s.player.toString() === req.user._id.toString());
  if (!player) return res.status(400).json({ success: false, message: 'You are not in this tournament' });

  // Find available player (not currently in an active game)
  const activeGameIds = tournament.pairings
    .flatMap(r => r.matches)
    .filter(m => m.status === 'in_progress')
    .map(m => [String(m.player1), String(m.player2)])
    .flat();

  const available = tournament.standings
    .filter(s => !activeGameIds.includes(String(s.player)) && String(s.player) !== String(req.user._id))
    .map(s => ({
      playerId: s.player,
      points: s.points,
      rating: 1200,
      waitingSince: Date.now()
    }));

  const pairing = pairingEngine.generateArenaPairing(available);
  if (!pairing) {
    return res.status(400).json({ success: false, message: 'No opponents available' });
  }

  const games = await pairingEngine.createGamesForPairings(tournament, [pairing], _io);
  await tournament.save();

  res.json({ success: true, message: 'Arena match created', game: games[0] });
};

exports.endTournament = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

  const sortedStandings = [...tournament.standings].sort((a, b) => b.points - a.points || b.tieBreak - a.tieBreak);

  if (tournament.entryFee > 0) {
    const wallet = await Wallet.findOne({ user: tournament.createdBy });
    if (wallet) {
      wallet.escrowBalance = Math.max(0, (wallet.escrowBalance || 0) - tournament.registeredCount * tournament.entryFee);
      wallet.balance = (wallet.balance || 0) + tournament.registeredCount * tournament.entryFee;
      await wallet.save();
    }
  }

  const prizeDistribution = tournament.prizes || [];
  for (let i = 0; i < prizeDistribution.length; i++) {
    const prize = prizeDistribution[i];
    if (prize.winner) continue;
    const winnerStanding = sortedStandings[i];
    if (!winnerStanding) break;
    const winnerWallet = await Wallet.findOne({ user: winnerStanding.player });
    if (winnerWallet) {
      winnerWallet.balance = (winnerWallet.balance || 0) + prize.amount;
      await winnerWallet.save();
      await Transaction.create({
        user: winnerStanding.player,
        amount: prize.amount,
        type: 'credit',
        reason: 'tournament_prize'
      });
    }
    prize.winner = winnerStanding.player;
    await User.findByIdAndUpdate(winnerStanding.player, {
      $inc: { tournamentsWon: 1, podiumFinishes: 1, totalPrizeMoney: prize.amount },
      bestFinish: i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`
    });
  }

  tournament.status = 'completed';
  tournament.standings = sortedStandings.map((s, idx) => ({ ...s.toObject(), position: idx + 1 }));
  await tournament.save();

  res.json({ success: true, message: 'Tournament completed', tournament });
};

exports.getStandings = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate('standings.player', 'name chessRating profileImage');
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  const sorted = tournament.standings.sort((a, b) => b.points - a.points || b.tieBreak - a.tieBreak);
  res.json({ success: true, standings: sorted.map((s, i) => ({ ...s.toObject(), rank: i + 1 })) });
};

exports.getPairings = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate('pairings.matches.player1', 'name chessRating')
    .populate('pairings.matches.player2', 'name chessRating');
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  res.json({ success: true, currentRound: tournament.currentRound, pairings: tournament.pairings });
};

exports.getMy = async (req, res) => {
  const tournaments = await Tournament.find({ registeredPlayers: req.user._id })
    .populate('createdBy', 'name').sort({ startDate: -1 });
  res.json({ success: true, tournaments });
};

exports.getStats = async (req, res) => {
  const [total, active, completed] = await Promise.all([
    Tournament.countDocuments(),
    Tournament.countDocuments({ status: { $in: ['registration_open', 'in_progress'] } }),
    Tournament.countDocuments({ status: 'completed' })
  ]);
  const totalPrize = await Tournament.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$prizePool' } } }
  ]);
  res.json({
    success: true,
    stats: { total, active, completed, totalPrizeDistributed: totalPrize[0]?.total || 0 }
  });
};

exports.submitResult = async (req, res) => {
  const { round, matchIndex, result } = req.body;
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  const roundData = tournament.pairings.find(p => p.round === round);
  if (!roundData) return res.status(404).json({ success: false, message: 'Round not found' });
  const match = roundData.matches[matchIndex];
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  if (match.status === 'completed') return res.status(400).json({ success: false, message: 'Match already completed' });

  match.result = result;
  match.status = 'completed';

  const p1Standing = tournament.standings.find(s => s.player.toString() === (match.player1 ? match.player1.toString() : ''));
  const p2Standing = tournament.standings.find(s => s.player.toString() === (match.player2 ? match.player2.toString() : ''));

  if (p1Standing && p2Standing) {
    if (result === '1-0') { p1Standing.points += 1; p1Standing.wins += 1; p2Standing.losses += 1; }
    else if (result === '0-1') { p2Standing.points += 1; p2Standing.wins += 1; p1Standing.losses += 1; }
    else if (result === '0.5-0.5') { p1Standing.points += 0.5; p1Standing.draws += 1; p2Standing.points += 0.5; p2Standing.draws += 1; }
  } else if (p1Standing && !p2Standing) {
    if (match.status === 'bye') { p1Standing.points += 1; p1Standing.wins += 1; }
  }

  await tournament.save();
  res.json({ success: true, message: 'Result submitted', tournament });
};

// Wrap all exports with asyncHandler
Object.keys(module.exports).forEach(key => {
  if (typeof module.exports[key] === 'function') {
    module.exports[key] = asyncHandler(module.exports[key]);
  }
});
