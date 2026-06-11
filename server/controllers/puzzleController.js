const Puzzle = require('../models/Puzzle');
const PuzzleProfile = require('../models/PuzzleProfile');
const puzzleEngine = require('../services/puzzleEngine');
const puzzleApi = require('../services/puzzleApiService');
const { Chess } = require('chess.js');

function normalizePuzzle(p) {
  if (!p) return p;
  return { ...p, _id: String(p._id), puzzleId: String(p.puzzleId || p.fen) };
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

const FALLBACK_PUZZLES = [
  { fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5', solution: ['Nxe5'], themes: ['fork'], rating: 800, difficulty: 'easy', source: 'fallback', playerSide: 'w', nbPlays: 0, popularity: 50 },
  { fen: 'r1bq1rk1/pppp1ppp/2n5/2b1P3/2B5/5N2/PPPP1PPP/RNBQ1RK1 b - - 0 6', solution: ['Nxe5'], themes: ['tactic'], rating: 600, difficulty: 'easy', source: 'fallback', playerSide: 'b', nbPlays: 0, popularity: 50 },
  { fen: 'rnbqkb1r/pppppppp/5n2/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2', solution: ['Nd5'], themes: ['tactic'], rating: 400, difficulty: 'beginner', source: 'fallback', playerSide: 'b', nbPlays: 0, popularity: 50 },
  { fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5', solution: ['Nxe4'], themes: ['fork', 'sacrifice'], rating: 1000, difficulty: 'medium', source: 'fallback', playerSide: 'b', nbPlays: 0, popularity: 50 },
  { fen: '8/5k2/8/8/8/8/5K2/8 w - - 0 1', solution: ['Ke3'], themes: ['endgame'], rating: 1200, difficulty: 'medium', source: 'fallback', playerSide: 'w', nbPlays: 0, popularity: 50 },
].map(normalizePuzzle);

const fallbackCache = { puzzles: [], daily: null, lastSync: 0, TTL: 300000 };

async function ensureFallbackCache() {
  if (fallbackCache.puzzles.length > 3 && Date.now() - fallbackCache.lastSync < fallbackCache.TTL) return;
  const base = [...FALLBACK_PUZZLES];
  try {
    const batch = await puzzleApi.fetchPuzzleBatch(10);
    if (batch.length > 0) {
      for (const p of batch) {
        const normalized = normalizePuzzle(p);
        normalized.solution = convertSolutionToSan(normalized.fen, normalized.solution);
        base.push(normalized);
      }
    }
  } catch {}
  fallbackCache.puzzles = base;
  fallbackCache.lastSync = Date.now();
}

async function findPuzzle(puzzleId) {
  if (!puzzleId) return null;
  let db;
  if (puzzleId.length === 24 || puzzleId.length > 30) {
    db = await Puzzle.findById(puzzleId).lean().catch(() => null);
  }
  if (!db) {
    db = await Puzzle.findOne({ puzzleId }).lean().catch(() => null);
  }
  if (!db && puzzleId.includes('/')) {
    db = await Puzzle.findOne({ fen: puzzleId }).lean().catch(() => null);
  }
  if (db) return db;
  await ensureFallbackCache();
  return fallbackCache.puzzles.find(p => p.puzzleId === puzzleId || p._id === puzzleId || p.fen === puzzleId) || null;
}

function enrichPuzzleForResponse(p) {
  if (!p) return p;
  return normalizePuzzle(p);
}

exports.getRandom = async (req, res) => {
  try {
    const count = await Puzzle.countDocuments({ isActive: true });
    if (count > 0) {
      const skip = Math.floor(Math.random() * count);
      const puzzle = await Puzzle.findOne({ isActive: true }).skip(skip).lean();
      if (puzzle) return res.json({ success: true, puzzle: enrichPuzzleForResponse(puzzle) });
    }

    await ensureFallbackCache();
    const fb = fallbackCache.puzzles;
    if (fb.length === 0) return res.json({ success: false, message: 'No puzzles available' });
    const puzzle = fb[Math.floor(Math.random() * fb.length)];
    res.json({ success: true, puzzle: enrichPuzzleForResponse(puzzle) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDaily = async (req, res) => {
  try {
    let puzzle = await puzzleEngine.getPuzzleOfTheDay();

    if (!puzzle) {
      await ensureFallbackCache();
      const today = new Date().toDateString();
      if (!fallbackCache.daily || new Date(fallbackCache.daily._cachedAt || 0).toDateString() !== today) {
        const api = await puzzleApi.fetchDailyPuzzle();
        if (api) {
          api._cachedAt = Date.now();
          api.solution = convertSolutionToSan(api.fen, api.solution);
          fallbackCache.daily = normalizePuzzle(api);
        } else {
          const fb = fallbackCache.puzzles;
          fallbackCache.daily = fb.length > 0 ? fb[Math.floor(Math.random() * fb.length)] : FALLBACK_PUZZLES[0];
          if (fallbackCache.daily) fallbackCache.daily._cachedAt = Date.now();
        }
      }
      puzzle = fallbackCache.daily;
    }

    if (!puzzle) return res.json({ success: false, message: 'No puzzles available.' });

    const profile = await puzzleEngine.getOrCreateProfile(req.user._id).catch(() => null);
    const dailySolved = profile?.dailyPuzzleSolved || false;
    const lastDaily = profile?.lastDailyDate || '';
    const today = new Date().toISOString().slice(0, 10);

    res.json({ success: true, puzzle: enrichPuzzleForResponse(puzzle), dailySolved: dailySolved && lastDaily === today });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getByTheme = async (req, res) => {
  try {
    const { theme } = req.params;
    const { limit = 20, page = 1 } = req.query || {};

    const puzzles = await Puzzle.getByTheme(theme, parseInt(limit));
    if (puzzles.length > 0) {
      const total = await Puzzle.countDocuments({ isActive: true, themes: theme });
      return res.json({ success: true, puzzles: puzzles.map(enrichPuzzleForResponse), total, page: parseInt(page), pages: Math.ceil(total / limit) });
    }

    await ensureFallbackCache();
    const filtered = fallbackCache.puzzles.filter(p => (p.themes || []).includes(theme) || p.theme === theme);
    const paged = filtered.slice(0, parseInt(limit)).map(enrichPuzzleForResponse);
    res.json({ success: true, puzzles: paged, total: filtered.length, page: parseInt(page), pages: Math.ceil(filtered.length / limit), source: 'fallback' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getByRating = async (req, res) => {
  try {
    const { min = 0, max = 3500 } = req.params.range ? req.params.range.split('-').map(Number) : {};
    const { limit = 20, page = 1 } = req.query || {};

    const puzzles = await Puzzle.getByRatingRange(min, max, parseInt(limit));
    if (puzzles.length > 0) {
      const total = await Puzzle.countDocuments({ isActive: true, rating: { $gte: min, $lte: max } });
      return res.json({ success: true, puzzles: puzzles.map(enrichPuzzleForResponse), total, page: parseInt(page), pages: Math.ceil(total / limit) });
    }

    await ensureFallbackCache();
    const filtered = fallbackCache.puzzles.filter(p => p.rating >= min && p.rating <= max);
    const paged = filtered.slice(0, parseInt(limit)).map(enrichPuzzleForResponse);
    res.json({ success: true, puzzles: paged, total: filtered.length, page: parseInt(page), pages: Math.ceil(filtered.length / limit), source: 'fallback' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecommended = async (req, res) => {
  try {
    const { limit = 10 } = req.query || {};
    const puzzles = await puzzleEngine.getRecommended(req.user._id, parseInt(limit)).catch(() => null);
    if (puzzles && puzzles.length > 0) return res.json({ success: true, puzzles: puzzles.map(enrichPuzzleForResponse) });

    await ensureFallbackCache();
    const fb = fallbackCache.puzzles.slice(0, parseInt(limit)).map(enrichPuzzleForResponse);
    res.json({ success: true, puzzles: fb, source: 'fallback' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.check = async (req, res) => {
  try {
    const { puzzleId, move, timeMs = 0 } = req.body;

    const puzzle = await findPuzzle(puzzleId);
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    const chess = new Chess(puzzle.fen);
    let playerMove;
    try {
      playerMove = chess.move(move);
    } catch {
      const match = chess.moves({ verbose: true }).filter(m =>
        m.san.toLowerCase().startsWith(move.toLowerCase())
      );
      if (match.length === 1) {
        playerMove = chess.move(match[0].san);
      } else {
        const result = await puzzleEngine.recordSolve(req.user._id, puzzle, false, timeMs).catch(() => null);
        return res.json({
          success: true,
          correct: false,
          message: 'Invalid move',
          result
        });
      }
    }

    const correctMoves = convertSolutionToSan(puzzle.fen, puzzle.solution || []);
    const isCorrect = correctMoves.length > 0 && playerMove.san === correctMoves[0];

    const result = await puzzleEngine.recordSolve(req.user._id, puzzle, isCorrect, timeMs).catch(() => null);

    const hint = isCorrect
      ? null
      : await puzzleEngine.getHint(puzzle.fen).catch(() => null);

    if (isCorrect && puzzleId && !puzzleId.startsWith('fallback-')) {
      await Puzzle.updateOne({ puzzleId }, { $inc: { solvedCount: 1 } }).catch(() => {});
    }

    const chessAfter = new Chess(puzzle.fen);
    chessAfter.move(playerMove.san);

    res.json({
      success: true,
      correct: isCorrect,
      message: isCorrect ? 'Correct!' : 'Incorrect. Try again!',
      san: playerMove.san,
      fen: chessAfter.fen(),
      gameOver: chessAfter.isGameOver(),
      solution: correctMoves.slice(1),
      hint: hint?.move || null,
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [globalStats, profile] = await Promise.all([
      puzzleEngine.getGlobalStats(),
      puzzleEngine.getOrCreateProfile(req.user._id).catch(() => null)
    ]);

    res.json({
      success: true,
      global: globalStats,
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

exports.getProfile = async (req, res) => {
  try {
    const profile = await puzzleEngine.getOrCreateProfile(req.user._id);
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
    const profile = await puzzleEngine.getOrCreateProfile(req.user._id);
    const today = new Date().toISOString().slice(0, 10);
    profile.dailyPuzzleSolved = true;
    profile.lastDailyDate = today;
    await profile.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHint = async (req, res) => {
  try {
    const { puzzleId } = req.params;
    const puzzle = await findPuzzle(puzzleId);
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    const hint = await puzzleEngine.getHint(puzzle.fen);
    res.json({ success: true, hint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
