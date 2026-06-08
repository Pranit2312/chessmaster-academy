const axios = require('axios');
const AiPuzzle = require('../models/AiPuzzle');

const LICHESS_API = 'https://lichess.org/api';
const REQUEST_TIMEOUT = 8000;

async function fetchDailyPuzzle() {
  try {
    const { data } = await axios.get(`${LICHESS_API}/puzzle/daily`, {
      timeout: REQUEST_TIMEOUT,
      headers: { 'Accept': 'application/json' }
    });

    if (!data || !data.puzzle) return null;
    return transformLichessPuzzle(data);
  } catch (err) {
    console.warn('Lichess daily puzzle fetch failed:', err.message);
    return null;
  }
}

async function fetchRandomPuzzle() {
  try {
    const { data } = await axios.get(`${LICHESS_API}/puzzle/next`, {
      timeout: REQUEST_TIMEOUT,
      headers: { 'Accept': 'application/json' }
    });

    if (!data || !data.puzzle) return null;
    return transformLichessPuzzle(data);
  } catch (err) {
    console.warn('Lichess random puzzle fetch failed:', err.message);
    return null;
  }
}

async function fetchPuzzleBatch(count = 10) {
  const puzzles = [];
  const seen = new Set();

  for (let i = 0; i < count * 3; i++) {
    try {
      const puzzle = await fetchRandomPuzzle();
      const key = puzzle ? puzzle.fen + '|' + (puzzle.solution || []).join(',') : '';
      if (puzzle && !seen.has(key)) {
        seen.add(key);
        puzzles.push(puzzle);
        if (puzzles.length >= count) break;
      }
    } catch {
      continue;
    }
  }

  return puzzles;
}

function transformLichessPuzzle(lichessData) {
  const puzzle = lichessData.puzzle;
  const game = lichessData.game;

  const fen = puzzle.fen;
  const solution = puzzle.solution || [];
  const initialPly = puzzle.initialPly || 0;

  const themes = (puzzle.themes || '').split(' ').filter(Boolean);
  const mappedThemes = [...new Set(themes.map(t => mapLichessTheme(t)).filter(Boolean))];
  const primaryTheme = mappedThemes[0] || 'tactic';

  const rating = puzzle.rating || 1500;
  const difficulty = ratingToDifficulty(rating);
  const playerSide = initialPly % 2 === 0 ? 'w' : 'b';

  const description = game
    ? `${game.players?.white?.name || '?'} vs ${game.players?.black?.name || '?'} — ${game.perf || 'Standard'}`
    : 'Lichess tactical puzzle';

  const tags = [...mappedThemes, 'lichess', difficulty, rating <= 1200 ? 'beginner' : rating <= 1600 ? 'intermediate' : 'advanced'];

  return {
    fen,
    solution,
    theme: primaryTheme,
    difficulty,
    rating,
    source: 'lichess',
    playerSide,
    description,
    hint: `Theme: ${primaryTheme.replace(/_/g, ' ')}. Rating: ${rating}`,
    tags: [...new Set(tags)],
    popularity: puzzle.plays || 0,
    timesSolved: 0
  };
}

function mapLichessTheme(theme) {
  const mapping = {
    'fork': 'fork', 'pin': 'pin', 'skewer': 'skewer',
    'capturingDefender': 'deflection', 'deflection': 'deflection',
    'attraction': 'attraction', 'interference': 'interference',
    'xRayAttack': 'x_ray', 'discoveredAttack': 'discovered_attack',
    'doubleCheck': 'double_check', 'checkmate': 'checkmate',
    'sacrifice': 'sacrifice', 'zugzwang': 'zwischenzug',
    'windmill': 'windmill', 'advancedPawn': 'pawn_breakthrough',
    'pawnEndgame': 'endgame', 'queenEndgame': 'endgame',
    'rookEndgame': 'endgame', 'knightEndgame': 'endgame',
    'bishopEndgame': 'endgame', 'endgame': 'endgame',
    'opening': 'tactic', 'middlegame': 'tactic',
    'oneMove': 'tactic', 'short': 'tactic', 'veryLong': 'tactic',
    'long': 'tactic', 'veryEasy': 'tactic', 'easy': 'tactic',
    'medium': 'tactic', 'hard': 'tactic', 'veryHard': 'tactic'
  };
  return mapping[theme] || null;
}

function ratingToDifficulty(rating) {
  if (rating < 1000) return 'beginner';
  if (rating < 1300) return 'easy';
  if (rating < 1700) return 'medium';
  if (rating < 2100) return 'hard';
  return 'expert';
}

const FALLBACK_PUZZLES = [
  { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['Nxe5'], theme: 'fork', difficulty: 'easy', rating: 800, source: 'manual', playerSide: 'w', description: 'Scholar\'s Mate fork', hint: 'Look for a knight fork', tags: ['fork', 'beginner'], timesSolved: 0 },
  { fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4', solution: ['Kd8'], theme: 'checkmate', difficulty: 'easy', rating: 600, source: 'manual', playerSide: 'b', description: 'Scholar\'s Mate escape', hint: 'The king must move', tags: ['checkmate', 'beginner'], timesSolved: 0 },
  { fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5', solution: ['Nxe4'], theme: 'fork', difficulty: 'easy', rating: 900, source: 'manual', playerSide: 'b', description: 'Italian Game fork', hint: 'Look for a knight fork on e4', tags: ['fork', 'beginner'], timesSolved: 0 },
  { fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b - - 0 6', solution: ['Ng4'], theme: 'pin', difficulty: 'medium', rating: 1100, source: 'manual', playerSide: 'b', description: 'Pin the knight', hint: 'Pin the f3 knight to the queen', tags: ['pin', 'intermediate'], timesSolved: 0 },
  { fen: 'r1bq1rk1/pppp1ppp/2n2n2/4p3/2BPP3/2N2N2/PP3PPP/R1BQ1RK1 b - - 0 6', solution: ['Nxe4'], theme: 'skewer', difficulty: 'medium', rating: 1200, source: 'manual', playerSide: 'b', description: 'Center fork', hint: 'Attack the center', tags: ['skewer', 'intermediate'], timesSolved: 0 },
  { fen: 'r1bq1rk1/ppp2ppp/2np4/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 7', solution: ['Ng5'], theme: 'tactic', difficulty: 'medium', rating: 1300, source: 'manual', playerSide: 'w', description: 'Knight attack', hint: 'Attack the f7 square', tags: ['tactic', 'intermediate'], timesSolved: 0 },
];

async function syncPuzzlesFromLichess(count = 50) {
  let created = 0;

  const batch = await fetchPuzzleBatch(count);
  if (batch.length > 0) {
    for (const puzzle of batch) {
      const exists = await AiPuzzle.findOne({
        fen: puzzle.fen,
        source: 'lichess',
        solution: puzzle.solution[0]
      });
      if (!exists) {
        await AiPuzzle.create(puzzle);
        created++;
      }
    }
    console.log(`Synced ${created} new puzzles from Lichess`);
  }

  for (const fallback of FALLBACK_PUZZLES) {
    const exists = await AiPuzzle.findOne({ fen: fallback.fen });
    if (!exists) {
      await AiPuzzle.create(fallback);
      created++;
    }
  }

  return created;
}

async function getDailyPuzzleFromLichess() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let puzzle = await AiPuzzle.findOne({
    source: { $in: ['lichess_daily', 'daily'] },
    createdAt: { $gte: today, $lt: tomorrow }
  });

  if (puzzle) return puzzle;

  const lichessDaily = await fetchDailyPuzzle();
  if (lichessDaily) {
    lichessDaily.source = 'lichess_daily';
    puzzle = await AiPuzzle.create(lichessDaily);
    return puzzle;
  }

  puzzle = await AiPuzzle.findOne({ isActive: true })
    .sort({ timesSolved: 1, createdAt: -1 });
  return puzzle || null;
}

module.exports = {
  fetchDailyPuzzle,
  fetchRandomPuzzle,
  fetchPuzzleBatch,
  syncPuzzlesFromLichess,
  getDailyPuzzleFromLichess,
  transformLichessPuzzle
};
