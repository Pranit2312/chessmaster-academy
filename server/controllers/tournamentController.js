const Tournament = require('../models/Tournament');
const User = require('../models/User');
const pairingEngine = require('../services/pairingEngine');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

let _io = null;
exports.setIO = (io) => { _io = io; };

function isCreator(tournament, userId) {
  return tournament.createdBy && String(tournament.createdBy) === String(userId);
}

function generateInviteCode() {
  return require('crypto').randomBytes(4).toString('hex').toUpperCase();
}

// =======================
// CREATE
// =======================
exports.create = async (req, res) => {
  console.log('Create tournament body:', JSON.stringify(req.body, null, 2));
  const { duration, visibility, ...rest } = req.body;
  const data = { ...rest, createdBy: req.user._id };
  if (data.timeControl) {
    data.timeControlLabel = `${data.timeControl.initial}+${data.timeControl.increment}`;
  }
  if (!data.duration && duration) data.duration = duration;
  if (!data.duration) return res.status(400).json({ success: false, message: 'Duration is required' });
  if (visibility === 'private') data.inviteCode = generateInviteCode();
  data.visibility = visibility || 'public';

  let tournament;
  try {
    tournament = await Tournament.create(data);
  } catch (err) {
    logger.error(`Tournament create failed: ${err.message}`, {
      body: req.body,
      validationErrors: err.errors ? Object.entries(err.errors).map(([k, v]) => ({ field: k, message: v.message, value: v.value })) : undefined,
      code: err.code,
      keyValue: err.keyValue
    });
    throw err;
  }
  tournament.registeredPlayers.push(req.user._id);
  tournament.registeredCount = 1;
  tournament.standings.push({ player: req.user._id, points: 0, wins: 0, draws: 0, losses: 0, tieBreak: 0 });
  await tournament.save();

  const populated = await Tournament.findById(tournament._id)
    .populate('createdBy', 'name email')
    .populate('registeredPlayers', 'name chessRating profileImage');
  res.status(201).json({ success: true, tournament: populated });
};

// =======================
// GET ALL
// =======================
exports.getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { visibility: 'public' };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.tournamentType = req.query.type;
  const [tournaments, total] = await Promise.all([
    Tournament.find(filter).populate('createdBy', 'name').sort({ startDate: -1 }).skip(skip).limit(limit),
    Tournament.countDocuments(filter)
  ]);
  res.json({ success: true, tournaments, total, page, pages: Math.ceil(total / limit) });
};

// =======================
// GET ACTIVE
// =======================
exports.getActive = async (req, res) => {
  const tournaments = await Tournament.find({
    status: { $in: ['registration_open', 'in_progress'] },
    visibility: 'public'
  }).populate('createdBy', 'name').sort({ startDate: 1 });
  res.json({ success: true, tournaments });
};

// =======================
// GET BY ID
// =======================
exports.getById = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('registeredPlayers', 'name chessRating profileImage')
    .populate('standings.player', 'name chessRating profileImage');
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.visibility === 'private' && !tournament.registeredPlayers.some(p => String(p._id) === String(req.user?._id)) && !isCreator(tournament, req.user?._id)) {
    const inviteCode = req.query.inviteCode || req.body.inviteCode;
    if (tournament.inviteCode !== inviteCode) return res.status(403).json({ success: false, message: 'Private tournament. Invite code required.' });
  }
  res.json({ success: true, tournament });
};

// =======================
// JOIN BY INVITE CODE
// =======================
exports.joinByInvite = async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ success: false, message: 'Invite code required' });
  const tournament = await Tournament.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'registration_open' });
  if (!tournament) return res.status(404).json({ success: false, message: 'Invalid invite code or tournament not found' });
  if (tournament.registeredPlayers.some(p => String(p) === String(req.user._id))) return res.status(400).json({ success: false, message: 'Already registered' });
  if (tournament.registeredCount >= tournament.maxPlayers) return res.status(400).json({ success: false, message: 'Tournament is full' });
  tournament.registeredPlayers.push(req.user._id);
  tournament.registeredCount = tournament.registeredPlayers.length;
  if (!tournament.standings.find(s => s.player.toString() === req.user._id.toString())) {
    tournament.standings.push({ player: req.user._id, points: 0, wins: 0, draws: 0, losses: 0, tieBreak: 0 });
  }
  await tournament.save();
  res.json({ success: true, message: 'Joined tournament', tournament });
};

// =======================
// REGISTER
// =======================
exports.register = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.status !== 'registration_open') return res.status(400).json({ success: false, message: 'Registration is not open' });
  if (tournament.registeredPlayers.includes(req.user._id)) return res.status(400).json({ success: false, message: 'Already registered' });
  if (tournament.registeredCount >= tournament.maxPlayers) return res.status(400).json({ success: false, message: 'Tournament is full' });
  if (tournament.ratingRestriction?.min && (req.user.chessRating || 0) < tournament.ratingRestriction.min) return res.status(400).json({ success: false, message: `Minimum rating required: ${tournament.ratingRestriction.min}` });
  if (tournament.ratingRestriction?.max && (req.user.chessRating || 9999) > tournament.ratingRestriction.max) return res.status(400).json({ success: false, message: `Maximum rating allowed: ${tournament.ratingRestriction.max}` });

  tournament.registeredPlayers.push(req.user._id);
  tournament.registeredCount = tournament.registeredPlayers.length;
  if (!tournament.standings.find(s => s.player.toString() === req.user._id.toString())) {
    tournament.standings.push({ player: req.user._id, points: 0, wins: 0, draws: 0, losses: 0, tieBreak: 0 });
  }
  await tournament.save();

  await User.findByIdAndUpdate(req.user._id, { $inc: { tournamentsPlayed: 1 } });
  const populated = await Tournament.findById(tournament._id)
    .populate('registeredPlayers', 'name chessRating profileImage');
  res.json({ success: true, message: 'Registered', tournament: populated });
};

// =======================
// UNREGISTER
// =======================
exports.unregister = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.status !== 'registration_open') return res.status(400).json({ success: false, message: 'Cannot unregister now' });

  if (isCreator(tournament, req.user._id)) {
    return res.status(400).json({ success: false, message: 'Creator cannot leave. Cancel tournament instead.' });
  }

  tournament.registeredPlayers.pull(req.user._id);
  tournament.registeredCount = tournament.registeredPlayers.length;
  tournament.standings = tournament.standings.filter(s => s.player.toString() !== req.user._id.toString());
  await tournament.save();
  res.json({ success: true, message: 'Unregistered' });
};

// =======================
// REMOVE PLAYER (creator)
// =======================
exports.removePlayer = async (req, res) => {
  const { playerId } = req.params;
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (!isCreator(tournament, req.user._id)) return res.status(403).json({ success: false, message: 'Only creator can remove players' });
  if (tournament.status !== 'registration_open') return res.status(400).json({ success: false, message: 'Cannot remove players after tournament starts' });
  if (String(tournament.createdBy) === playerId) return res.status(400).json({ success: false, message: 'Cannot remove yourself as creator' });

  tournament.registeredPlayers.pull(playerId);
  tournament.registeredCount = tournament.registeredPlayers.length;
  tournament.standings = tournament.standings.filter(s => s.player.toString() !== playerId);
  await tournament.save();
  res.json({ success: true, message: 'Player removed' });
};

// =======================
// UPDATE (creator, before start)
// =======================
exports.update = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (!isCreator(tournament, req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only creator can edit' });
  if (tournament.status !== 'registration_open' && tournament.status !== 'draft') return res.status(400).json({ success: false, message: 'Cannot edit after tournament starts' });

  const allowed = ['name', 'description', 'banner', 'maxPlayers', 'duration', 'rules', 'isRated', 'isPublic', 'visibility', 'allowSpectators', 'allowLateJoin', 'ratingRestriction'];
  if (req.user.role !== 'admin') {
    const newStart = req.body.startDate ? new Date(req.body.startDate) : tournament.startDate;
    const minStart = new Date(Date.now() + 5 * 60 * 1000);
    if (newStart < minStart) return res.status(400).json({ success: false, message: 'Start time must be at least 5 minutes from now' });
  }

  const updates = {};
  allowed.forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  if (req.body.timeControl) {
    updates.timeControl = req.body.timeControl;
    updates.timeControlLabel = `${req.body.timeControl.initial}+${req.body.timeControl.increment}`;
  }
  if (req.body.startDate) updates.startDate = req.body.startDate;
  if (updates.visibility === 'private' && tournament.visibility !== 'private' && !tournament.inviteCode) {
    updates.inviteCode = generateInviteCode();
  }

  const updated = await Tournament.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('createdBy', 'name email')
    .populate('registeredPlayers', 'name chessRating profileImage');
  res.json({ success: true, tournament: updated });
};

// =======================
// CANCEL (creator)
// =======================
exports.cancel = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (!isCreator(tournament, req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only creator can cancel' });
  if (tournament.status === 'completed' || tournament.status === 'cancelled') return res.status(400).json({ success: false, message: 'Tournament already ended' });
  tournament.status = 'cancelled';
  await tournament.save();
  res.json({ success: true, message: 'Tournament cancelled' });
};

// =======================
// START (creator)
// =======================
exports.startTournament = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (!isCreator(tournament, req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only creator can start' });
  if (tournament.status !== 'registration_open' && tournament.status !== 'registration_closed') {
    return res.status(400).json({ success: false, message: 'Cannot start tournament in current state' });
  }
  if (tournament.registeredCount < 2) return res.status(400).json({ success: false, message: 'Need at least 2 players' });

  tournament.status = 'registration_closed';
  await tournament.save();

  const players = tournament.standings.map(s => ({
    playerId: s.player,
    points: s.points,
    tieBreak: s.tieBreak
  }));

  let firstRound = [];
  let totalRounds = 0;

  switch (tournament.tournamentType) {
    case 'swiss':
      totalRounds = tournament.totalRounds || Math.min(players.length - 1, 7);
      firstRound = pairingEngine.generateSwissPairings(players, 1, []);
      break;
    case 'round_robin':
      totalRounds = players.length - 1;
      firstRound = pairingEngine.generateRoundRobinPairings(players, 1);
      break;
    case 'arena':
      totalRounds = 0;
      break;
    default:
      return res.status(400).json({ success: false, message: 'Unsupported tournament type' });
  }

  tournament.totalRounds = totalRounds;
  tournament.currentRound = tournament.tournamentType === 'arena' ? 0 : 1;
  tournament.status = 'in_progress';
  tournament.startedAt = new Date();
  tournament.endDate = new Date(Date.now() + tournament.duration * 60 * 1000);

  if (firstRound.length > 0) {
    tournament.pairings = [{
      round: 1,
      matches: firstRound.map(m => ({
        player1: m.player1,
        player2: m.player2,
        result: m.player2 ? null : '1-0',
        status: m.player2 ? 'scheduled' : 'bye'
      }))
    }];
    for (const m of tournament.pairings[0].matches) {
      if (m.status === 'bye') {
        const s = tournament.standings.find(st => st.player && String(st.player) === String(m.player1));
        if (s) { s.points += 1; s.wins += 1; }
      }
    }
    await tournament.save();
    const activeMatches = tournament.pairings[0].matches.filter(m => m.status === 'scheduled' && m.player2);
    await pairingEngine.createGamesForPairings(tournament, activeMatches, _io);
    await tournament.save();
  } else {
    await tournament.save();
  }

  res.json({ success: true, message: 'Tournament started', tournament });
};

// =======================
// NEXT ROUND (creator)
// =======================
exports.nextRound = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (!isCreator(tournament, req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only creator can advance rounds' });
  if (tournament.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Tournament not in progress' });
  if (tournament.tournamentType === 'arena') return res.status(400).json({ success: false, message: 'Arena tournaments are continuous' });

  // Check all current round matches completed
  const currentRoundMatches = tournament.pairings.find(p => p.round === tournament.currentRound);
  const allComplete = currentRoundMatches?.matches?.every(m => m.status === 'completed');
  if (!allComplete && req.user.role !== 'admin') return res.status(400).json({ success: false, message: 'All matches in current round must be completed first' });

  if (tournament.currentRound >= tournament.totalRounds) {
    return await endTournament(req, res);
  }

  const nextRoundNum = tournament.currentRound + 1;
  const players = tournament.standings.map(s => ({
    playerId: s.player,
    points: s.points,
    tieBreak: s.tieBreak
  }));

  let nextPairings = [];
  switch (tournament.tournamentType) {
    case 'swiss':
      nextPairings = pairingEngine.generateSwissPairings(players, nextRoundNum, tournament.pairings.map(p => p.matches));
      break;
    case 'round_robin':
      nextPairings = pairingEngine.generateRoundRobinPairings(players, nextRoundNum);
      break;
    default:
      return res.status(400).json({ success: false, message: 'Unsupported tournament type' });
  }

  tournament.currentRound = nextRoundNum;
  const newMatches = nextPairings.map(m => ({
    player1: m.player1,
    player2: m.player2,
    result: m.player2 ? null : '1-0',
    status: m.player2 ? 'scheduled' : 'bye'
  }));
  tournament.pairings.push({ round: nextRoundNum, matches: newMatches });

  for (const m of newMatches) {
    if (m.status === 'bye') {
      const s = tournament.standings.find(st => st.player && String(st.player) === String(m.player1));
      if (s) { s.points += 1; s.wins += 1; }
    }
  }
  await tournament.save();

  const activeMatches = newMatches.filter(m => m.status === 'scheduled' && m.player2);
  await pairingEngine.createGamesForPairings(tournament, activeMatches, _io);
  await tournament.save();

  res.json({ success: true, message: `Round ${nextRoundNum} started`, tournament });
};

// =======================
// ARENA PAIR
// =======================
exports.arenaPair = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.tournamentType !== 'arena' || tournament.status !== 'in_progress') {
    return res.status(400).json({ success: false, message: 'Not an active arena tournament' });
  }

  if (!tournament.standings.find(s => s.player.toString() === req.user._id.toString())) {
    return res.status(400).json({ success: false, message: 'You are not in this tournament' });
  }

  const activeGameIds = tournament.pairings
    .flatMap(r => r.matches)
    .filter(m => m.status === 'in_progress')
    .map(m => [String(m.player1), String(m.player2)])
    .flat();

  if (activeGameIds.includes(String(req.user._id))) return res.status(400).json({ success: false, message: 'You already have an active game' });

  const available = tournament.standings
    .filter(s => !activeGameIds.includes(String(s.player)) && String(s.player) !== String(req.user._id))
    .map(s => ({
      playerId: s.player,
      points: s.points,
      rating: 1200,
      waitingSince: Date.now()
    }));

  const pairing = pairingEngine.generateArenaPairing(available);
  if (!pairing) return res.status(400).json({ success: false, message: 'No opponents available' });

  const games = await pairingEngine.createGamesForPairings(tournament, [pairing], _io);
  await tournament.save();

  res.json({ success: true, message: 'Arena match created', game: games[0] });
};

// =======================
// END TOURNAMENT (creator)
// =======================
async function endTournament(req, res) {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (!isCreator(tournament, req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only creator can end' });
  if (tournament.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Tournament not in progress' });

  const sortedStandings = [...tournament.standings].sort((a, b) => b.points - a.points || b.tieBreak - a.tieBreak);

  const winner = sortedStandings[0]?.player;
  if (winner) {
    await User.findByIdAndUpdate(winner, { $inc: { tournamentsWon: 1 } });
  }
  sortedStandings.slice(0, 3).forEach(async (s, idx) => {
    await User.findByIdAndUpdate(s.player, { $inc: { podiumFinishes: 1 }, bestFinish: idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd' });
  });

  tournament.status = 'completed';
  tournament.completedAt = new Date();
  tournament.standings = sortedStandings.map((s, idx) => {
    const obj = s.toObject ? s.toObject() : { ...s };
    return { ...obj, position: idx + 1 };
  });
  await tournament.save();

  res.json({ success: true, message: 'Tournament completed', tournament });
}
exports.endTournament = asyncHandler(endTournament);

// =======================
// GET STANDINGS
// =======================
exports.getStandings = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate('standings.player', 'name chessRating profileImage');
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  const sorted = tournament.standings.sort((a, b) => b.points - a.points || b.tieBreak - a.tieBreak);
  res.json({ success: true, standings: sorted.map((s, i) => ({ ...s.toObject(), rank: i + 1 })) });
};

// =======================
// GET PAIRINGS
// =======================
exports.getPairings = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate('pairings.matches.player1', 'name chessRating')
    .populate('pairings.matches.player2', 'name chessRating');
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  res.json({ success: true, currentRound: tournament.currentRound, pairings: tournament.pairings });
};

// =======================
// GET MY TOURNAMENTS
// =======================
exports.getMy = async (req, res) => {
  const tournaments = await Tournament.find({
    $or: [
      { registeredPlayers: req.user._id },
      { createdBy: req.user._id }
    ]
  }).populate('createdBy', 'name').sort({ startDate: -1 });
  res.json({ success: true, tournaments });
};

// =======================
// GET STATS
// =======================
exports.getStats = async (req, res) => {
  const [total, active, completed, upcoming] = await Promise.all([
    Tournament.countDocuments({ visibility: 'public' }),
    Tournament.countDocuments({ status: { $in: ['registration_open', 'in_progress'] }, visibility: 'public' }),
    Tournament.countDocuments({ status: 'completed', visibility: 'public' }),
    Tournament.countDocuments({ status: 'registration_open', visibility: 'public', startDate: { $gt: new Date() } })
  ]);
  const totalPlayers = await Tournament.aggregate([
    { $match: { visibility: 'public' } },
    { $group: { _id: null, total: { $sum: '$registeredCount' } } }
  ]);
  res.json({
    success: true,
    stats: { total, active, completed, upcoming, totalPlayers: totalPlayers[0]?.total || 0 }
  });
};

// =======================
// GET USER PROFILE STATS
// =======================
exports.getProfileStats = async (req, res) => {
  const userId = req.user._id;
  const [joined, created, wins] = await Promise.all([
    Tournament.countDocuments({ registeredPlayers: userId }),
    Tournament.countDocuments({ createdBy: userId }),
    Tournament.countDocuments({ createdBy: userId, status: 'completed', 'standings.player': userId, 'standings.position': 1 })
  ]);
  const user = await User.findById(userId).select('tournamentsPlayed tournamentsWon podiumFinishes bestFinish totalTournamentGames');
  const bestFinish = user?.bestFinish || null;
  const totalGames = user?.totalTournamentGames || 0;
  res.json({ success: true, stats: { joined, created, won: wins, bestFinish, totalGames, tournamentsPlayed: user?.tournamentsPlayed || 0, tournamentsWon: user?.tournamentsWon || 0 } });
};

// =======================
// SUBMIT RESULT (from game engine)
// =======================
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
  }
  await tournament.save();

  // Update user game count
  if (match.player1) await User.findByIdAndUpdate(match.player1, { $inc: { totalTournamentGames: 1 } }).catch(() => {});
  if (match.player2) await User.findByIdAndUpdate(match.player2, { $inc: { totalTournamentGames: 1 } }).catch(() => {});

  res.json({ success: true, message: 'Result submitted', tournament });
};

Object.keys(module.exports).forEach(key => {
  if (key !== 'setIO' && key !== 'endTournament' && typeof module.exports[key] === 'function') {
    module.exports[key] = asyncHandler(module.exports[key]);
  }
});