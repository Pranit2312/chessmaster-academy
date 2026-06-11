const { Chess } = require('chess.js');
const { analyzeFen } = require('./stockfishEngine');

const OPENING_POSITIONS = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1',
  'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  'rnbqkbnr/pppppppp/8/8/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 0 1',
];

const THEMES = ['fork', 'pin', 'skewer', 'checkmate', 'sacrifice', 'discovered_attack', 'double_check', 'deflection', 'tactic'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function generateSinglePuzzle(targetDifficulty, maxAttempts = 20) {
  const difficultySettings = {
    beginner: { minEval: 2.0, maxEval: 4.0, depth: 12, movesFromStart: [4, 8] },
    easy: { minEval: 1.8, maxEval: 5.0, depth: 14, movesFromStart: [6, 12] },
    medium: { minEval: 2.5, maxEval: 8.0, depth: 16, movesFromStart: [8, 18] },
    hard: { minEval: 3.0, maxEval: 12.0, depth: 18, movesFromStart: [10, 25] },
    expert: { minEval: 3.5, maxEval: 20.0, depth: 20, movesFromStart: [12, 30] },
  };

  const settings = difficultySettings[targetDifficulty] || difficultySettings.medium;
  const ratingMap = { beginner: 600, easy: 1000, medium: 1400, hard: 1800, expert: 2200 };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const chess = new Chess(getRandomElement(OPENING_POSITIONS));
      const movesToPlay = settings.movesFromStart[0] + Math.floor(Math.random() * (settings.movesFromStart[1] - settings.movesFromStart[0]));

      for (let i = 0; i < movesToPlay; i++) {
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) break;
        const move = moves[Math.floor(Math.random() * Math.min(moves.length, 3))];
        chess.move(move.san);
      }

      const fen = chess.fen();
      const turn = chess.turn();
      const result = await analyzeFen(fen, settings.depth);

      if (!result || !result.bestMoveSan || result.evalCp === undefined) continue;

      const evalScore = turn === 'b' ? -result.evalCp : result.evalCp;

      const needsSolution = evalScore < settings.minEval * 100;
      if (!needsSolution) continue;

      const solution = result.pv && result.pv.length > 0 ? result.pv : [result.bestMoveSan];
      const evaledAfter = result.evalCp;
      const swing = Math.abs(evaledAfter - evalScore) / 100;

      if (swing < 1.5) continue;

      chess.move(solution[0]);
      const postFen = chess.fen();
      const isCheckmate = chess.isCheckmate();
      const isCheck = chess.isCheck();

      const theme = isCheckmate ? 'checkmate' : getRandomElement(THEMES);
      const playerSide = turn;
      const rating = ratingMap[targetDifficulty] + Math.floor(Math.random() * 201) - 100;

      return {
        fen,
        solution: solution.slice(0, 4),
        theme,
        difficulty: targetDifficulty,
        rating: Math.max(200, Math.min(3000, rating)),
        source: 'generated',
        playerSide,
        description: `${turn === 'w' ? 'White' : 'Black'} to find the best move`,
        hint: isCheckmate ? 'Look for checkmate!' : `Find a tactic worth ${swing.toFixed(1)} pawns`,
        tags: [theme, targetDifficulty, turn === 'w' ? 'white' : 'black'],
        popularity: 0,
        timesSolved: 0,
      };
    } catch {
      continue;
    }
  }

  return null;
}

async function generatePuzzleBatch(count = 10) {
  const puzzles = [];
  const seen = new Set();

  const difficulties = ['beginner', 'easy', 'medium', 'hard', 'expert'];
  for (let i = 0; i < count; i++) {
    const diff = difficulties[i % difficulties.length];
    const puzzle = await generateSinglePuzzle(diff);
    if (puzzle && !seen.has(puzzle.fen)) {
      seen.add(puzzle.fen);
      puzzles.push(puzzle);
    }
  }

  return puzzles.sort((a, b) => a.rating - b.rating);
}

async function generateDailyPuzzle() {
  const seed = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const diff = ['beginner', 'easy', 'medium', 'hard', 'expert'][Math.abs(hash) % 5];
  return await generateSinglePuzzle(diff, 30);
}

async function ensurePuzzles(count = 20) {
  const batches = [];
  const difficulties = ['beginner', 'easy', 'medium', 'hard', 'expert'];

  for (let i = 0; i < 3; i++) {
    for (const diff of difficulties) {
      const p = await generateSinglePuzzle(diff);
      if (p) batches.push(p);
      if (batches.length >= count) break;
    }
    if (batches.length >= count) break;
  }

  return batches.length > 0 ? batches : null;
}

module.exports = {
  generateSinglePuzzle,
  generatePuzzleBatch,
  generateDailyPuzzle,
  ensurePuzzles,
  OPENING_POSITIONS,
};
