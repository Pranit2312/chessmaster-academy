const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');
const PuzzleProfile = require('../models/PuzzleProfile');
const puzzleEngine = require('../services/puzzleEngine');
const { Chess } = require('chess.js');

function normalizePuzzle(p) {
  if (!p) return p;
  return { ...p, _id: String(p._id), puzzleId: String(p.puzzleId) };
}

function isUci(move) {
  return /^[a-h][1-8][a-h][1-8]([qrbn])?$/.test(move);
}

function convertSolutionToSan(fen, solution) {
  if (!solution || solution.length === 0) return [];
  if (!isUci(solution[0])) return solution;
  const chess = new Chess(fen);
  const result = [];
  for (const m of solution) {
    try {
      const move = chess.move(m, { sloppy: true });
      result.push(move.san);
    } catch {
      result.push(m);
    }
  }
  return result;
}

function validatePuzzle(puzzle) {
  if (!puzzle || !puzzle.fen || !puzzle.solution || puzzle.solution.length === 0) return false;
  try {
    const chess = new Chess(puzzle.fen);
    const sideToMove = chess.turn();
    const playerSide = puzzle.playerSide || 'w';
    if (sideToMove !== playerSide) {
      return false;
    }

    // Replay all moves, ensuring they produce SAN (not raw UCI)
    // This catches mixed SAN/UCI solutions from buggy imports
    const test = new Chess(puzzle.fen);
    const expectedColor = sideToMove;
    for (let i = 0; i < puzzle.solution.length; i++) {
      let moveResult;
      try {
        moveResult = test.move(puzzle.solution[i], { sloppy: true });
      } catch {
        return false;
      }
      if (!moveResult) return false;
      // Verify the output is SAN (moveResult.san is always SAN from chess.js)
      const isUci = /^[a-h][1-8][a-h][1-8]([qrbn])?$/.test(puzzle.solution[i]);
      if (isUci && moveResult.san !== puzzle.solution[i]) {
        return false; // Stored UCI but produced different SAN — mixed solution
      }
      const turnAtMove = i % 2 === 0 ? expectedColor : (expectedColor === 'w' ? 'b' : 'w');
      if (moveResult.color !== turnAtMove) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function getOrCreateProfile(userId) {
  let profile = await PuzzleProfile.findOne({ user: userId });
  if (!profile) {
    profile = await PuzzleProfile.create({ user: userId });
  }
  return profile;
}

const dailyPuzzleCache = { puzzle: null, date: '' };

function getDailyPuzzleId() {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

exports.getRandom = async (req, res) => {
  try {
    let puzzle = null;
    for (let attempts = 0; attempts < 8; attempts++) {
      const [candidate] = await Puzzle.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 1 } }
      ]);
      if (candidate && validatePuzzle(candidate)) {
        puzzle = candidate;
        break;
      }
    }
    if (!puzzle) return res.json({ success: false, message: 'No valid puzzles available' });
    res.json({ success: true, puzzle: normalizePuzzle(puzzle) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDaily = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (dailyPuzzleCache.date !== today) {
      dailyPuzzleCache.puzzle = null;
      dailyPuzzleCache.date = '';
      const seed = getDailyPuzzleId();
      const count = await Puzzle.countDocuments({ isActive: true });
      if (count > 0) {
        for (let offset = 0; offset < 100; offset++) {
          const skip = (seed + offset) % count;
          const candidate = await Puzzle.findOne({ isActive: true }).skip(skip).lean();
          if (candidate && validatePuzzle(candidate)) {
            dailyPuzzleCache.puzzle = candidate;
            break;
          }
        }
        dailyPuzzleCache.date = today;
      }
    }
    const puzzle = dailyPuzzleCache.puzzle;
    if (!puzzle) return res.json({ success: false, message: 'No puzzles available.' });

    const profile = await getOrCreateProfile(req.user._id).catch(() => null);
    const dailySolved = profile?.dailyPuzzleSolved || false;
    const lastDaily = profile?.lastDailyDate || '';

    res.json({ success: true, puzzle: normalizePuzzle(puzzle), dailySolved: dailySolved && lastDaily === today });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getByTheme = async (req, res) => {
  try {
    const { theme } = req.params;
    const { limit = 20, page = 1 } = req.query || {};
    const puzzles = await Puzzle.getByTheme(theme, parseInt(limit) * 3);
    const valid = puzzles.filter(p => validatePuzzle(p)).slice(0, parseInt(limit));
    const total = await Puzzle.countDocuments({ isActive: true, themes: theme });
    res.json({ success: true, puzzles: valid.map(normalizePuzzle), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getByRating = async (req, res) => {
  try {
    const { min = 0, max = 3500 } = req.params.range ? req.params.range.split('-').map(Number) : {};
    const { limit = 20, page = 1 } = req.query || {};
    const puzzles = await Puzzle.getByRatingRange(min, max, parseInt(limit) * 2);
    const valid = puzzles.filter(validatePuzzle).slice(0, parseInt(limit));
    const total = await Puzzle.countDocuments({ isActive: true, rating: { $gte: min, $lte: max } });
    res.json({ success: true, puzzles: valid.map(normalizePuzzle), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBySingleRating = async (req, res) => {
  try {
    const { rating } = req.params;
    const r = parseInt(rating);
    if (isNaN(r)) return res.status(400).json({ success: false, message: 'Invalid rating' });
    const range = 100;
    const min = Math.max(200, r - range);
    const max = Math.min(3500, r + range);
    const { limit = 20, page = 1 } = req.query || {};
    const puzzles = await Puzzle.getByRatingRange(min, max, parseInt(limit) * 2);
    const valid = puzzles.filter(validatePuzzle).slice(0, parseInt(limit));
    const total = await Puzzle.countDocuments({ isActive: true, rating: { $gte: min, $lte: max } });
    res.json({ success: true, puzzles: valid.map(normalizePuzzle), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecommended = async (req, res) => {
  try {
    const { limit = 10 } = req.query || {};
    const profile = await getOrCreateProfile(req.user._id);
    const weakThemes = [];
    if (profile.themeStats) {
      for (const [theme, stats] of profile.themeStats) {
        if (stats.attempts >= 3 && (stats.solved / stats.attempts) < 0.4) {
          weakThemes.push(theme);
        }
      }
    }
    const puzzles = await Puzzle.getRecommended({ puzzleRating: profile.puzzleRating || 1200, weakThemes }, parseInt(limit) * 2);
    const valid = puzzles.filter(validatePuzzle).slice(0, parseInt(limit));
    if (valid.length === 0) {
      const fallbackPuzzles = await Puzzle.find({ isActive: true }).sort({ popularity: -1 }).limit(parseInt(limit) * 2).lean();
      const fallbackValid = fallbackPuzzles.filter(validatePuzzle).slice(0, parseInt(limit));
      return res.json({ success: true, puzzles: fallbackValid.map(normalizePuzzle) });
    }
    res.json({ success: true, puzzles: valid.map(normalizePuzzle) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const { limit = 20, theme, minRating, maxRating, rating, popularity } = req.query;
    const puzzles = await Puzzle.searchPuzzles({ theme, minRating: parseInt(minRating), maxRating: parseInt(maxRating), rating: parseInt(rating), popularity: parseInt(popularity) }, parseInt(limit) * 2);
    const valid = puzzles.filter(validatePuzzle).slice(0, parseInt(limit));
    res.json({ success: true, puzzles: valid.map(normalizePuzzle), total: valid.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { puzzleId } = req.params;
    let puzzle;
    if (puzzleId.length === 24) {
      puzzle = await Puzzle.findById(puzzleId).lean().catch(() => null);
    }
    if (!puzzle) puzzle = await Puzzle.findOne({ puzzleId }).lean();
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });
    if (!validatePuzzle(puzzle)) return res.status(400).json({ success: false, message: 'Invalid puzzle data' });
    res.json({ success: true, puzzle: normalizePuzzle(puzzle) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.check = async (req, res) => {
  try {
    const { puzzleId, move, timeMs = 0, completed = false, forfeit = false } = req.body;
    let puzzle;
    if (puzzleId && puzzleId.length === 24) {
      puzzle = await Puzzle.findById(puzzleId).lean().catch(() => null);
    }
    if (!puzzle) puzzle = await Puzzle.findOne({ puzzleId }).lean();
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    // Forfeit — user gave up (Show Solution or skip)
    if (forfeit) {
      const engResult = await puzzleEngine.recordSolve(req.user._id, puzzle, false, timeMs);
      return res.json({
        success: true,
        correct: false,
        forfeit: true,
        message: 'Puzzle skipped',
        ratingUpdate: engResult.ratingUpdate,
        profile: engResult.profile
      });
    }

    // Validate the full solution line
    const chess = new Chess(puzzle.fen);
    const sideToMove = chess.turn();
    const correctMoves = [];
    let gameOver = false;
    let validSolution = true;
    for (const rawMove of (puzzle.solution || [])) {
      let played;
      try {
        played = chess.move(rawMove, { sloppy: true });
      } catch {
        validSolution = false;
        break;
      }
      if (!played) { validSolution = false; break; }
      correctMoves.push(played.san);
    }
    gameOver = chess.isGameOver();
    const fenAfter = chess.fen();

    if (!validSolution) {
      return res.status(500).json({ success: false, message: 'Invalid puzzle solution in database' });
    }

    // completed: true means user played through the entire solution
    if (completed) {
      const engResult = await puzzleEngine.recordSolve(req.user._id, puzzle, true, timeMs);
      await Puzzle.updateOne({ _id: puzzle._id }, { $inc: { solvedCount: 1 } }).catch(() => {});
      return res.json({
        success: true,
        correct: true,
        message: 'Correct! Puzzle solved!',
        san: correctMoves[correctMoves.length - 1],
        fen: fenAfter,
        gameOver,
        solution: [],
        ratingUpdate: engResult.ratingUpdate,
        profile: engResult.profile
      });
    }

    // Non-final move check: validate the single move against the solution
    const testChess = new Chess(puzzle.fen);
    let playerMove;
    try {
      playerMove = testChess.move(move);
    } catch {
      const match = testChess.moves({ verbose: true }).filter(m =>
        m.san.toLowerCase().startsWith(move.toLowerCase())
      );
      if (match.length === 1) {
        playerMove = testChess.move(match[0].san);
      } else {
        return res.json({ success: true, correct: false, message: 'Invalid move' });
      }
    }

    const isCorrect = correctMoves.length > 0 && playerMove.san === correctMoves[0];

    res.json({
      success: true,
      correct: isCorrect,
      message: isCorrect ? 'Correct!' : 'Incorrect. Try again!',
      san: playerMove.san,
      fen: fenAfter,
      gameOver,
      solution: correctMoves.slice(1)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [totalPuzzles, profile] = await Promise.all([
      Puzzle.countDocuments({ isActive: true }),
      getOrCreateProfile(req.user._id).catch(() => null)
    ]);

    res.json({
      success: true,
      global: { totalPuzzles },
      user: profile ? {
        puzzleRating: profile.puzzleRating,
        solvedCount: profile.solvedCount,
        accuracy: profile.accuracy,
        currentStreak: profile.currentStreak,
        bestStreak: profile.bestStreak,
        averageSolveTime: profile.averageSolveTime,
        weakThemes: profile.weakThemes,
        strongThemes: profile.strongThemes,
        themeStats: Object.fromEntries(profile.themeStats)
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getThemes = async (req, res) => {
  try {
    const themes = await Puzzle.distinct('themes', { isActive: true });
    const counts = await Promise.all(
      themes.map(theme =>
        Puzzle.countDocuments({ isActive: true, themes: theme })
          .then(c => ({ name: theme, count: c }))
      )
    );
    counts.sort((a, b) => b.count - a.count);
    res.json({ success: true, themes: counts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    const recentHistory = (profile.puzzleHistory || []).slice(-20).reverse();

    res.json({
      success: true,
      profile: {
        puzzleRating: profile.puzzleRating,
        solvedCount: profile.solvedCount,
        correctCount: profile.correctCount,
        incorrectCount: profile.incorrectCount,
        accuracy: profile.accuracy,
        currentStreak: profile.currentStreak,
        bestStreak: profile.bestStreak,
        averageSolveTime: profile.averageSolveTime,
        weakThemes: profile.weakThemes,
        strongThemes: profile.strongThemes,
        themeStats: Object.fromEntries(profile.themeStats),
        dailyPuzzleSolved: profile.dailyPuzzleSolved,
        rushBestScore: profile.rushBestScore
      },
      history: recentHistory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markDailySolved = async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    const today = new Date().toISOString().slice(0, 10);
    profile.dailyPuzzleSolved = true;
    profile.lastDailyDate = today;
    await profile.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const HINT_THEMES = {
  fork: 'Look for a fork — one piece attacking two or more targets',
  pin: 'Look for a pin — a piece that cannot move without exposing a more valuable piece',
  skewer: 'Look for a skewer — a valuable piece in the line of attack with a less valuable piece behind it',
  discoveredattack: 'Look for a discovered attack — moving one piece to reveal an attack by another',
  discoveredcheck: 'Look for discovered check — moving a piece to reveal check from another',
  sacrifice: 'Consider a sacrifice — giving up material for a positional or attacking advantage',
  deflection: 'Look for a deflection — forcing a piece away from a defensive task',
  attraction: 'Look for an attraction — luring a piece to a vulnerable square',
  clearance: 'Look for a clearance sacrifice — removing a piece that blocks your own attack',
  interference: 'Look for an interference move — placing a piece between an attacker and its target',
  trapping: 'Look for a trapped piece — a piece with no escape squares',
  promotion: 'Consider promoting a pawn to gain material',
  endgame: 'In the endgame, look for king activity and pawn promotion',
  matein1: 'Checkmate in one move!',
  matein2: 'Checkmate in two moves — look for a forcing sequence',
  matein3: 'Checkmate in three moves — find the attacking sequence',
  matein4: 'Checkmate in four moves — calculate the full line',
  middlegame: 'Look for tactical motifs — forks, pins, or discovered attacks'
};

exports.getHint = async (req, res) => {
  try {
    const { puzzleId } = req.params;
    let puzzle;
    if (puzzleId.length === 24) {
      puzzle = await Puzzle.findById(puzzleId).lean().catch(() => null);
    }
    if (!puzzle) puzzle = await Puzzle.findOne({ puzzleId }).lean();
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    const moves = convertSolutionToSan(puzzle.fen, puzzle.solution || []);
    const firstMove = moves.length > 0 ? moves[0] : null;
    const firstMoveRaw = puzzle.solution?.[0] || '';
    const themeHint = (puzzle.themes || [])
      .map(t => HINT_THEMES[t.toLowerCase().replace(/\s+/g, '')])
      .filter(Boolean);
    const hintText = themeHint.length > 0
      ? themeHint[0]
      : 'Look for tactics in this position';

    let from = '';
    let to = '';
    if (firstMoveRaw.length >= 4) {
      from = firstMoveRaw.slice(0, 2);
      to = firstMoveRaw.slice(2, 4);
    } else {
      const chess = new Chess(puzzle.fen);
      try {
        const m = chess.move(firstMoveRaw, { sloppy: true });
        from = m.from;
        to = m.to;
      } catch {
        try {
          const g = new Chess(puzzle.fen);
          const match = g.moves({ verbose: true }).find(mv => mv.san === firstMove);
          if (match) { from = match.from; to = match.to; }
        } catch {}
      }
    }

    res.json({
      success: true,
      hint: {
        move: firstMove,
        text: hintText,
        fen: puzzle.fen,
        rating: puzzle.rating,
        from,
        to,
        solution: moves
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

let healthCache = { totalPuzzles: 0, ratingRange: null, themeCount: 0, dbSizeMB: 0, indexedFields: [], ts: 0 };
const HEALTH_CACHE_TTL = 300000;

async function refreshHealthCache() {
  try {
    const [totalPuzzles, ratingStats, themes, indexes, collStats] = await Promise.all([
      Puzzle.countDocuments({ isActive: true }),
      Puzzle.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, min: { $min: '$rating' }, max: { $max: '$rating' } } }
      ]),
      Puzzle.distinct('themes'),
      Puzzle.collection.indexes(),
      mongoose.connection.db.command({ collStats: 'puzzles' })
    ]);
    healthCache = {
      totalPuzzles,
      ratingRange: ratingStats[0] ? { min: ratingStats[0].min, max: ratingStats[0].max } : null,
      themeCount: (themes || []).filter(Boolean).length,
      dbSizeMB: +(collStats.size / 1024 / 1024).toFixed(1),
      indexedFields: [...new Set(indexes.map(i => Object.keys(i.key)).flat())],
      ts: Date.now()
    };
  } catch (err) {
    console.error('Health cache refresh failed:', err.message);
  }
}

exports.health = async (req, res) => {
  try {
    if (Date.now() - healthCache.ts > HEALTH_CACHE_TTL || healthCache.totalPuzzles === 0) {
      await refreshHealthCache();
    }
    res.json({ success: true, ...healthCache, importStatus: healthCache.totalPuzzles > 0 ? 'imported' : 'empty' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.warmHealthCache = refreshHealthCache;

exports.debugPuzzle = async (req, res) => {
  try {
    const { id } = req.params;
    let puzzle;
    if (id.length === 24) puzzle = await Puzzle.findById(id).lean().catch(() => null);
    if (!puzzle) puzzle = await Puzzle.findOne({ puzzleId: id }).lean();
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    const chess = new Chess(puzzle.fen);
    const sideToMove = chess.turn();
    let isValid = true;
    let moveCount = 0;
    const sanMoves = [];
    const testChess = new Chess(puzzle.fen);

    for (const raw of (puzzle.solution || [])) {
      try {
        const m = testChess.move(raw, { sloppy: true });
        sanMoves.push({ raw, san: m.san, color: m.color, from: m.from, to: m.to });
        moveCount++;
      } catch (e) {
        sanMoves.push({ raw, error: e.message });
        isValid = false;
        break;
      }
    }

    const firstMoveUci = puzzle.solution?.[0] || '';
    const fromFirst = firstMoveUci.length >= 4 ? firstMoveUci.slice(0, 2) : '';
    const toFirst = firstMoveUci.length >= 4 ? firstMoveUci.slice(2, 4) : '';

    res.json({
      success: true,
      puzzleId: puzzle.puzzleId,
      fen: puzzle.fen,
      sideToMove,
      playerSide: puzzle.playerSide,
      firstMoveRaw: firstMoveUci,
      firstMoveFrom: fromFirst,
      firstMoveTo: toFirst,
      firstMoveSan: sanMoves[0]?.san || '',
      moveCount,
      solutionLength: puzzle.solution?.length || 0,
      sanMoves,
      isValid,
      playerSideMatchesFen: puzzle.playerSide === sideToMove,
      rating: puzzle.rating,
      themes: puzzle.themes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
