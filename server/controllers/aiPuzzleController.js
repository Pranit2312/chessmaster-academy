const AiPuzzle = require('../models/AiPuzzle');
const puzzleApi = require('../services/puzzleApiService');
const { Chess } = require('chess.js');

const puzzleCache = { puzzles: [], daily: null, lastSync: 0, TTL: 300000 };
let fetchInProgress = null;

let cacheIdCounter = 1;
function assignCacheId(p) {
  if (!p._id) p._id = `cache_${cacheIdCounter++}`;
  return p;
}

const FALLBACK_PUZZLES = [
  { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['Nxe5'], theme: 'fork', difficulty: 'easy', rating: 800, source: 'manual', playerSide: 'w', description: 'Knight fork', hint: 'Look for a fork' },
  { fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4', solution: ['Kd8'], theme: 'checkmate', difficulty: 'easy', rating: 600, source: 'manual', playerSide: 'b', description: 'Escape checkmate', hint: 'Move the king' },
  { fen: 'rnbqkb1r/pppppppp/5n2/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2', solution: ['Nd5'], theme: 'tactic', difficulty: 'beginner', rating: 400, source: 'manual', playerSide: 'b', description: 'Knight to center', hint: 'Develop the knight' },
];

function ensureFallbackPuzzles() {
  if (puzzleCache.puzzles.length === 0) {
    puzzleCache.puzzles = FALLBACK_PUZZLES.map(assignCacheId);
    puzzleCache.lastSync = Date.now();
  }
}

async function ensureCache() {
  const now = Date.now();
  if (now - puzzleCache.lastSync < puzzleCache.TTL) return;
  if (fetchInProgress) return fetchInProgress;
  puzzleCache.lastSync = now;
  fetchInProgress = (async () => {
    try {
      const batch = await puzzleApi.fetchPuzzleBatch(6);
      if (batch.length > 0) {
        puzzleCache.puzzles = batch.map(assignCacheId);
      } else {
        puzzleCache.lastSync = 0;
      }
    } catch {
      puzzleCache.lastSync = 0;
    } finally {
      fetchInProgress = null;
    }
  })();
  await fetchInProgress;
  ensureFallbackPuzzles();
}

exports.getDailyPuzzle = async (req, res) => {
  try {
    await ensureCache();
    if (puzzleCache.daily) {
      const today = new Date().toDateString();
      const cachedDay = new Date(puzzleCache.daily._cachedAt || 0).toDateString();
      if (cachedDay !== today) puzzleCache.daily = null;
    }
    if (!puzzleCache.daily) {
      const api = await puzzleApi.fetchDailyPuzzle();
      if (api) {
        api._cachedAt = Date.now();
        puzzleCache.daily = api;
      }
    }
    const puzzle = puzzleCache.daily || puzzleCache.puzzles[0] || null;
    if (!puzzle) {
      return res.json({ success: false, message: 'No puzzle available. Try browsing puzzles.' });
    }
    res.json({ success: true, puzzle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get daily puzzle', error: error.message });
  }
};

exports.getPuzzles = async (req, res) => {
  try {
    ensureFallbackPuzzles();
    const { page = 1, limit = 12, difficulty, theme } = req.query;
    let filtered = puzzleCache.puzzles;
    if (difficulty) filtered = filtered.filter(p => p.difficulty === difficulty);
    if (theme) filtered = filtered.filter(p => p.theme === theme);
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + parseInt(limit));
    try {
      const dbCount = await AiPuzzle.countDocuments({ isActive: true }).catch(() => 0);
      if (dbCount > 0) {
        const dbQuery = { isActive: true };
        if (difficulty) dbQuery.difficulty = difficulty;
        if (theme) dbQuery.theme = theme;
        const dbPuzzles = await AiPuzzle.find(dbQuery)
          .sort({ rating: 1 })
          .skip(start)
          .limit(parseInt(limit))
          .select('-solution')
          .lean()
          .catch(() => []);
        if (dbPuzzles.length > 0) {
          const total = await AiPuzzle.countDocuments(dbQuery).catch(() => 0);
          return res.json({ success: true, puzzles: dbPuzzles, total, page: parseInt(page), pages: Math.ceil(total / limit), source: 'database' });
        }
      }
    } catch {}
    res.json({
      success: true,
      puzzles: paged.map(p => ({ ...p, solution: undefined })),
      total: filtered.length,
      page: parseInt(page),
      pages: Math.ceil(filtered.length / limit),
      source: puzzleCache.lastSync > 0 ? 'api_cache' : 'fallback'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get puzzles', error: error.message });
  }
};

exports.getPuzzleById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ success: false, message: 'Invalid puzzle ID' });
    }
    const dbPuzzle = await AiPuzzle.findById(id).lean().catch(() => null);
    if (dbPuzzle) return res.json({ success: true, puzzle: dbPuzzle });
    const cached = puzzleCache.puzzles.find(p => p.fen === req.params.id || p._id === req.params.id);
    if (cached) return res.json({ success: true, puzzle: cached });
    res.status(404).json({ success: false, message: 'Puzzle not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get puzzle', error: error.message });
  }
};

exports.solvePuzzle = async (req, res) => {
  try {
    const { id } = req.params;
    const { move } = req.body;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ success: false, message: 'Invalid puzzle ID' });
    }
    let puzzle = await AiPuzzle.findById(id).catch(() => null);
    if (!puzzle) {
      puzzle = puzzleCache.puzzles.find(p => p._id === id || p.fen === id);
    }
    if (!puzzle) {
      return res.status(404).json({ success: false, message: 'Puzzle not found' });
    }
    const chess = new Chess(puzzle.fen);
    let playerMove;
    try {
      playerMove = chess.move(move);
    } catch {
      const match = chess.moves().filter(m => m.toLowerCase().startsWith(move.toLowerCase()));
      if (match.length === 1) {
        playerMove = chess.move(match[0]);
      } else {
        return res.json({ success: true, correct: false, message: 'Invalid move', hint: puzzle.hint || 'Try a different move' });
      }
    }
    const solution = puzzle.solution || [];
    const isCorrect = solution.length > 0 && playerMove.san === solution[0];
    if (isCorrect && puzzle.__v !== undefined) {
      try {
        puzzle.timesSolved = (puzzle.timesSolved || 0) + 1;
        await puzzle.save();
      } catch {}
    }
    res.json({
      success: true,
      correct: isCorrect,
      message: isCorrect ? 'Correct!' : 'Not quite. Try again!',
      san: playerMove.san,
      fen: chess.fen(),
      gameOver: chess.isGameOver(),
      hint: isCorrect ? null : (puzzle.hint || null)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check solution', error: error.message });
  }
};

exports.getPuzzleStats = async (req, res) => {
  try {
    const byDifficulty = {};
    const byTheme = {};
    for (const p of puzzleCache.puzzles) {
      byDifficulty[p.difficulty] = (byDifficulty[p.difficulty] || 0) + 1;
      byTheme[p.theme] = (byTheme[p.theme] || 0) + 1;
    }
    try {
      const dbDiff = await AiPuzzle.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$difficulty', count: { $sum: 1 } } }]).catch(() => []);
      const dbTheme = await AiPuzzle.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$theme', count: { $sum: 1 } } }]).catch(() => []);
      for (const d of dbDiff) byDifficulty[d._id] = (byDifficulty[d._id] || 0) + d.count;
      for (const t of dbTheme) byTheme[t._id] = (byTheme[t._id] || 0) + t.count;
    } catch {}
    res.json({
      success: true,
      stats: {
        totalPuzzles: puzzleCache.puzzles.length,
        byDifficulty,
        byTheme
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stats', error: error.message });
  }
};

exports.syncPuzzles = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10;
    const batch = await puzzleApi.fetchPuzzleBatch(count);
    let dbCreated = 0;
    for (const p of batch) {
      const exists = puzzleCache.puzzles.some(c => c.fen === p.fen);
      if (!exists) {
        puzzleCache.puzzles.push(assignCacheId(p));
      }
      try {
        const dbExists = await AiPuzzle.findOne({ fen: p.fen }).catch(() => null);
        if (!dbExists) {
          await AiPuzzle.create(p).catch(() => {});
          dbCreated++;
        }
      } catch {}
    }
    puzzleCache.lastSync = Date.now();
    res.json({ success: true, synced: batch.length, total: puzzleCache.puzzles.length, message: `Synced ${batch.length} puzzles` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to sync puzzles', error: error.message });
  }
};

exports.resetPuzzles = async (req, res) => {
  try {
    puzzleCache.puzzles = [];
    puzzleCache.daily = null;
    puzzleCache.lastSync = 0;
    try { await AiPuzzle.deleteMany({}).catch(() => {}); } catch {}
    const batch = await puzzleApi.fetchPuzzleBatch(12);
    for (const p of batch) {
      puzzleCache.puzzles.push(assignCacheId(p));
      try { await AiPuzzle.create(p).catch(() => {}); } catch {}
    }
    ensureFallbackPuzzles();
    res.json({ success: true, count: batch.length, message: `Reset and seeded ${batch.length} fresh puzzles` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset puzzles', error: error.message });
  }
};
