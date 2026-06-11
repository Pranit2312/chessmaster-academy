const axios = require('axios');
const { Chess } = require('chess.js');

const LICHESS_API = 'https://lichess.org/api';
const CHESSCOM_API = 'https://api.chess.com/pub/puzzle';
const TIMEOUT = 15000;
const QUICK_TIMEOUT = 5000;

// ===================== LICHESS =====================

async function fetchLichessDaily() {
  try {
    const { data } = await axios.get(`${LICHESS_API}/puzzle/daily`, {
      timeout: TIMEOUT,
      headers: { 'Accept': 'application/json' }
    });
    if (!data || !data.puzzle) return null;
    return fromLichess(data);
  } catch (err) {
    console.warn('Lichess daily failed:', err.message);
    return null;
  }
}

function uciToSan(fen, uciMoves) {
  try {
    const chess = new Chess(fen);
    return uciMoves.map(m => {
      try { const mv = chess.move(m, { sloppy: true }); return mv.san; }
      catch { return m; }
    });
  } catch { return uciMoves; }
}

function fromLichess(d) {
  const puzzle = d.puzzle;
  const game = d.game;

  const fen = puzzle.fen;
  const rawSolution = puzzle.solution || [];
  const moves = uciToSan(fen, rawSolution.slice(0, 8));

  const themes = ((puzzle.themes || '') + ' ' + (puzzle.themes || ''))
    .split(' ').filter(Boolean).map(t => mapTheme(t)).filter(Boolean);
  const primary = themes[0] || 'tactic';

  const rating = puzzle.rating || 1500;
  const playerSide = (puzzle.initialPly || 0) % 2 === 0 ? 'w' : 'b';

  return {
    fen,
    solution: moves,
    theme: primary,
    themes: [...new Set(themes)],
    difficulty: ratingToDifficulty(rating),
    rating,
    source: 'lichess',
    playerSide,
    description: game
      ? `${game.players?.white?.name || '?'} vs ${game.players?.black?.name || '?'}`
      : 'Lichess puzzle',
    hint: `Rating ${rating}`,
    popularity: puzzle.plays || 0
  };
}

// ===================== CHESS.COM =====================

async function fetchChesscomDaily() {
  try {
    const { data } = await axios.get(`${CHESSCOM_API}`, { timeout: TIMEOUT });
    return fromChesscom(data);
  } catch (err) {
    console.warn('Chess.com daily failed:', err.message);
    return null;
  }
}

async function fetchChesscomRandom() {
  try {
    const { data } = await axios.get(`${CHESSCOM_API}/random`, { timeout: QUICK_TIMEOUT });
    return fromChesscom(data);
  } catch (err) {
    console.warn('Chess.com random failed:', err.message);
    return null;
  }
}

function fromChesscom(d) {
  const fen = d.fen;
  if (!fen) return null;

  const pgn = d.pgn || '';
  const moves = parsePgnMoves(pgn);

  if (moves.length === 0) return null;

  const chess = new Chess(fen);
  const isMate = moves.some(m => m.includes('#'));
  const playerSide = chess.turn();

  const rating = estimateRating(fen, moves, isMate);
  const theme = detectTheme(fen, moves, isMate);

  return {
    fen,
    solution: moves,
    theme,
    themes: [theme],
    difficulty: ratingToDifficulty(rating),
    rating,
    source: 'chesscom',
    playerSide,
    description: d.title || 'Chess.com puzzle',
    hint: `${theme.replace(/_/g, ' ')} puzzle`,
    popularity: 0
  };
}

function parsePgnMoves(pgn) {
  const lines = pgn.split('\n').filter(l => !l.startsWith('[') && l.trim());
  const text = lines.join(' ').trim();
  if (!text) return [];

  const tokens = text.split(/\s+/);
  const moves = [];

  for (const t of tokens) {
    if (/^\d+\.\.\.$/.test(t)) continue;
    if (/^\d+\.$/.test(t)) continue;
    if (t === '1-0' || t === '0-1' || t === '1/2-1/2' || t === '*') continue;
    if (/^[Oo0]-[Oo0]/.test(t)) {
      moves.push(t);
      continue;
    }
    const clean = t.replace(/[+#?!]/g, '');
    if (/^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?$/.test(clean) ||
        /^[a-h][1-8]$/.test(clean)) {
      moves.push(t.replace(/[+#?!]/g, ''));
    }
  }

  return moves.slice(0, 12);
}

function detectTheme(fen, moves, isMate) {
  if (isMate) return 'checkmate';

  const text = moves.join(' ').toLowerCase();

  if (moves.some(m => /[KQRBN]x?[a-h][1-8]=[QRBN]/.test(m))) return 'promotion';
  if (text.includes('q') && moves.some(m => /^[a-h]x?[a-h]8=/.test(m))) return 'queen_endgame';

  const moveCount = moves.length;
  if (moveCount <= 3) return 'tactic';
  if (moveCount <= 6) return 'endgame';
  return 'tactic';
}

function estimateRating(fen, moves, isMate) {
  const chess = new Chess(fen);
  const pieceCount = chess.board().flat().filter(Boolean).length;
  let base = 1200;

  if (pieceCount <= 6) base = 1500;
  else if (pieceCount <= 10) base = 1400;
  else if (pieceCount <= 20) base = 1200;
  else base = 1000;

  if (isMate) base += 100;
  if (moves.length > 5) base += 200;
  else if (moves.length > 3) base += 100;

  return base + Math.floor(Math.random() * 201) - 100;
}

// ===================== SHARED =====================

function mapTheme(t) {
  const m = {
    'fork': 'fork', 'pin': 'pin', 'skewer': 'skewer',
    'capturingDefender': 'deflection', 'deflection': 'deflection',
    'attraction': 'attraction', 'interference': 'interference',
    'xRayAttack': 'x_ray', 'discoveredAttack': 'discovered_attack',
    'doubleCheck': 'double_check', 'checkmate': 'checkmate',
    'sacrifice': 'sacrifice', 'zugzwang': 'zwischenzug',
    'windmill': 'windmill', 'advancedPawn': 'pawn_breakthrough',
    'endgame': 'endgame',
  };
  return m[t] || null;
}

function ratingToDifficulty(rating) {
  if (rating < 1000) return 'beginner';
  if (rating < 1300) return 'easy';
  if (rating < 1700) return 'medium';
  if (rating < 2100) return 'hard';
  return 'expert';
}

async function fetchDailyPuzzle() {
  let p = await fetchLichessDaily();
  if (p) return p;
  p = await fetchChesscomDaily();
  return p || null;
}

async function fetchRandomPuzzle() {
  let p = await fetchChesscomRandom();
  if (p) return p;
  p = await fetchLichessDaily();
  return p || null;
}

async function fetchPuzzleBatch(count = 10) {
  const puzzles = [];
  const seen = new Set();

  const attempts = Math.max(count * 3, 15);
  for (let i = 0; i < attempts && i < 20; i++) {
    try {
      const p = await fetchChesscomRandom();
      if (p && !seen.has(p.fen)) {
        seen.add(p.fen);
        puzzles.push(p);
        if (puzzles.length >= count) break;
      }
    } catch {
      continue;
    }
  }

  if (puzzles.length < 3) {
    const daily = await fetchLichessDaily();
    if (daily && !seen.has(daily.fen)) {
      puzzles.unshift(daily);
    }
  }

  return puzzles;
}

module.exports = {
  fetchDailyPuzzle,
  fetchRandomPuzzle,
  fetchPuzzleBatch,
  fetchLichessDaily,
  fetchChesscomDaily,
  fetchChesscomRandom,
  fromLichess,
  fromChesscom,
};
