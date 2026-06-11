const logger = require('../utils/logger');

// --- Swiss ---

exports.generateSwissPairings = (players, currentRound, previousPairings) => {
  const paired = new Set();
  const pairings = [];
  const sorted = [...players].sort((a, b) => b.points - a.points || b.tieBreak - a.tieBreak);
  for (let i = 0; i < sorted.length; i++) {
    if (paired.has(i)) continue;
    let opponent = -1;
    for (let j = i + 1; j < sorted.length; j++) {
      if (paired.has(j)) continue;
      if (!havePlayed(sorted[i].playerId, sorted[j].playerId, previousPairings)) {
        opponent = j;
        break;
      }
    }
    if (opponent === -1) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (paired.has(j)) { opponent = j; break; }
      }
    }
    if (opponent !== -1) {
      paired.add(i); paired.add(opponent);
      pairings.push({ player1: sorted[i].playerId, player2: sorted[opponent].playerId });
    } else {
      paired.add(i);
      pairings.push({ player1: sorted[i].playerId, player2: null });
    }
  }
  return pairings;
};

// --- Round Robin ---

exports.generateRoundRobinPairings = (players, round) => {
  const n = players.length;
  const half = Math.ceil(n / 2);
  const rotated = [...players];
  const first = rotated.shift();
  const mid = Math.ceil(rotated.length / 2);
  const left = rotated.slice(0, mid);
  const right = rotated.slice(mid).reverse();
  if (round % 2 === 0) {
    const pairings = [];
    if (left.length === right.length) {
      for (let i = 0; i < left.length; i++) pairings.push({ player1: left[i].playerId, player2: right[i].playerId });
    } else {
      pairings.push({ player1: first, player2: left[0] });
      for (let i = 1; i < left.length; i++) pairings.push({ player1: left[i].playerId, player2: right[i - 1]?.playerId || null });
    }
    return pairings;
  }
  const pairings = [];
  const all = [first, ...left, ...right];
  for (let i = 0; i < half; i++) {
    pairings.push({ player1: all[i]?.playerId, player2: all[all.length - 1 - i]?.playerId });
  }
  return pairings;
};

// --- Knockout ---

exports.generateKnockoutBracket = (players) => {
  const sorted = [...players].sort((a, b) => b.points - a.points || b.tieBreak - a.tieBreak);
  const n = sorted.length;
  const size = Math.pow(2, Math.ceil(Math.log2(n)));
  const bracket = [];
  for (let i = 0; i < size / 2; i++) {
    const p1 = sorted[i]?.playerId || null;
    const p2 = sorted[size - 1 - i]?.playerId || null;
    bracket.push({ player1: p1, player2: p2 });
  }
  return { bracket, size, round: 1 };
};

// --- Double Elimination ---

exports.generateDoubleEliminationBracket = (players) => {
  const sorted = [...players].sort((a, b) => b.points - a.points || b.tieBreak - a.tieBreak);
  const n = sorted.length;
  const size = Math.pow(2, Math.ceil(Math.log2(n)));

  // Winners bracket: standard pairing (1 vs last, 2 vs second-last, etc.)
  const winnersBracket = [];
  for (let i = 0; i < size / 2; i++) {
    const p1 = sorted[i]?.playerId || null;
    const p2 = sorted[size - 1 - i]?.playerId || null;
    winnersBracket.push({
      matchId: `wb_r1_m${i}`,
      player1: p1,
      player2: p2,
      result: null,
      status: p2 ? 'scheduled' : 'bye'
    });
  }

  // Losers bracket: empty initially — populated when players drop from winners
  const losersBracket = [];

  return {
    size,
    round: 1,
    winnersBracket,
    losersBracket
  };
};

exports.generateDoubleEliminationNextRound = (tournament) => {
  const currentRound = tournament.currentRound;
  const lastPairing = tournament.pairings[tournament.pairings.length - 1];
  if (!lastPairing) return [];

  const completedMatches = lastPairing.matches.filter(m => m.status === 'completed');
  const winners = completedMatches.filter(m => m.result === '1-0').map(m => m.player1);
  const losers = completedMatches.filter(m => m.result === '0-1').map(m => m.player2);

  // In round 1, losers go to losers bracket round 1
  // In subsequent rounds, winners bracket winners advance, losers bracket winners advance
  const nextMatches = [];

  if (currentRound === 1) {
    // Winners bracket round 2
    for (let i = 0; i < winners.length; i += 2) {
      nextMatches.push({
        player1: winners[i],
        player2: winners[i + 1] || null,
        winnerBracket: true,
        result: null,
        status: 'scheduled'
      });
    }
    // Losers bracket round 1: losers from winners bracket round 1 face each other
    for (let i = 0; i < losers.length; i += 2) {
      nextMatches.push({
        player1: losers[i],
        player2: losers[i + 1] || null,
        winnerBracket: false,
        result: null,
        status: 'scheduled'
      });
    }
  } else {
    // Complex double-elimination logic — simplified: just pair remaining players
    const allPlayers = [...new Set([
      ...winners,
      ...losers.filter(id => !eliminatedPlayers(tournament, id))
    ])];

    for (let i = 0; i < allPlayers.length; i += 2) {
      nextMatches.push({
        player1: allPlayers[i],
        player2: allPlayers[i + 1] || null,
        status: 'scheduled'
      });
    }
  }

  return nextMatches;
};

function eliminatedPlayers(tournament, playerId) {
  // A player is eliminated if they've lost twice (once in winners, once in losers)
  let losses = 0;
  for (const round of tournament.pairings) {
    for (const match of round.matches) {
      if (match.status !== 'completed') continue;
      const pid = String(playerId);
      if (String(match.player1) === pid && match.result === '0-1') losses++;
      if (String(match.player2) === pid && match.result === '1-0') losses++;
    }
  }
  return losses >= 2;
}

// --- Arena ---

exports.generateArenaPairing = (availablePlayers) => {
  if (availablePlayers.length < 2) return null;
  // Sort by waiting time (longest wait first), then by score
  const sorted = [...availablePlayers].sort((a, b) => {
    if (a.waitingSince && b.waitingSince) return a.waitingSince - b.waitingSince;
    return (b.points || 0) - (a.points || 0);
  });

  const p1 = sorted[0];
  let bestMatch = null;
  let bestRatingDiff = Infinity;

  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.abs((p1.rating || 1200) - (sorted[i].rating || 1200));
    if (diff < bestRatingDiff && !havePlayedArena(p1.playerId, sorted[i].playerId, sorted)) {
      bestRatingDiff = diff;
      bestMatch = sorted[i];
    }
  }

  if (!bestMatch) bestMatch = sorted[1];
  if (!bestMatch) return null;

  return {
    player1: p1.playerId,
    player2: bestMatch.playerId,
    status: 'scheduled'
  };
};

function havePlayedArena(p1, p2, recentOpponents) {
  // In arena, we don't prevent re-pairing — just a simple check
  return false;
}

// --- Tiebreak ---

exports.calculateTieBreak = (standings, matches) => {
  return standings.map(s => {
    const opponents = matches
      .filter(m => m.player1 === s.player || m.player2 === s.player)
      .map(m => {
        const oppId = m.player1 === s.player ? m.player2 : m.player1;
        const opp = standings.find(st => st.player === oppId);
        return opp ? opp.points : 0;
      });
    const buchholz = opponents.reduce((sum, p) => sum + p, 0);
    return { ...s, tieBreak: buchholz };
  });
};

// --- Game creation helper ---

async function createGamesForPairings(tournament, pairings, io) {
  const Game = require('../models/Game');
  const mongoose = require('mongoose');
  const tc = tournament.timeControl;
  const games = [];

  for (const match of pairings) {
    if (!match.player2) continue; // bye
    if (match.status === 'completed') continue;

    const gameId = new mongoose.Types.ObjectId();
    const game = await Game.create({
      _id: gameId,
      players: [
        { user: match.player1, color: 'white' },
        { user: match.player2, color: 'black' }
      ],
      status: 'active',
      timeControl: tc,
      timeControlLabel: tournament.timeControlLabel || `${tc.initial}+${tc.increment}`,
      tournament: tournament._id,
      tournamentRound: tournament.currentRound || 1,
      clocks: {
        white: tc.initial * 60 * 1000,
        black: tc.initial * 60 * 1000,
        lastMoveAt: Date.now()
      },
      startedAt: new Date()
    });
    games.push(game);

    match.gameId = game._id;
    match.status = 'in_progress';

    // Notify players via sockets
    if (io) {
      [match.player1, match.player2].forEach(uid => {
        const opponentId = String(uid) === String(match.player1) ? match.player2 : match.player1;
        io.to(`user:${uid}`).emit('match:found', {
          gameId: game._id.toString(),
          opponent: { userId: opponentId },
          timeControl: tc,
          timeControlLabel: tournament.timeControlLabel || `${tc.initial}+${tc.increment}`,
          color: String(uid) === String(match.player1) ? 'white' : 'black',
          tournament: tournament._id.toString(),
          tournamentName: tournament.name
        });
      });
    }
  }

  return games;
}

exports.createGamesForPairings = createGamesForPairings;

function havePlayed(p1, p2, previousPairings) {
  if (!previousPairings || !previousPairings.length) return false;
  for (const round of previousPairings) {
    for (const match of round) {
      if ((match.player1 === p1 && match.player2 === p2) || (match.player1 === p2 && match.player2 === p1)) return true;
    }
  }
  return false;
}
