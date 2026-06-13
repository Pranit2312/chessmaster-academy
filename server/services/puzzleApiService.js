const axios = require('axios');
const https = require('https');
const http = require('http');
const { Chess } = require('chess.js');
const logger = require('../utils/logger');

const LICHESS_API = 'https://lichess.org/api';
const CHESSCOM_API = 'https://api.chess.com/pub/puzzle';
const TIMEOUT = 15000;
const QUICK_TIMEOUT = 8000;
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY = 1000;
const CACHE_TTL = 300000;

const DEFAULT_HEADERS = {
  'User-Agent': 'ChessMasterAcademy/1.0',
  'Accept': 'application/json',
  'Accept-Language': 'en-US',
  'Connection': 'keep-alive'
};

function createAgent(url) {
  if (url.startsWith('https')) {
    return new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV !== 'development',
      keepAlive: true,
      timeout: TIMEOUT
    });
  }
  return new http.Agent({ keepAlive: true, timeout: TIMEOUT });
}

const lichessAgent = createAgent(LICHESS_API);
const chesscomAgent = createAgent(CHESSCOM_API);

const responseCache = new Map();

function getCached(key) {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  responseCache.delete(key);
  return null;
}

function setCached(key, data) {
  responseCache.set(key, { data, ts: Date.now() });
}

function getCacheKey(url, params) {
  return url + '|' + JSON.stringify(params || {});
}

function isRetryable(err) {
  if (err.response) {
    const status = err.response.status;
    if (status === 403 || status === 404) return false;
    if (status >= 400 && status < 500) return false;
  }
  return true;
}

async function withRetry(fn, options = {}) {
  const retries = options.retries ?? MAX_RETRIES;
  const baseDelay = options.baseDelay ?? BASE_RETRY_DELAY;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries || !isRetryable(err)) throw err;
      const delay = Math.min(baseDelay * Math.pow(2, i), 5000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

const chesscomBlockedUntil = { value: 0 };

function isChesscomBlocked() {
  return Date.now() < chesscomBlockedUntil.value;
}

function blockChesscom(durationMs = CACHE_TTL) {
  chesscomBlockedUntil.value = Date.now() + durationMs;
  responseCache.delete(CHESSCOM_API);
  responseCache.delete(`${CHESSCOM_API}/random`);
}

async function fetchLichessDaily() {
  const url = `${LICHESS_API}/puzzle/daily`;
  const cached = getCached(url);
  if (cached) return cached;
  try {
    const { data } = await withRetry(() => axios.get(url, {
      timeout: TIMEOUT,
      httpsAgent: lichessAgent,
      headers: DEFAULT_HEADERS
    }));
    if (!data || !data.puzzle) return null;
    const result = fromLichess(data);
    if (result) setCached(url, result);
    return result;
  } catch (err) {
    logger.warn('Lichess daily failed:', err.message);
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
  return validatePuzzle({
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
  });
}

async function fetchChesscomDaily() {
  const url = CHESSCOM_API;
  const cached = getCached(url);
  if (cached) return cached;
  if (isChesscomBlocked()) return null;
  try {
    const { data } = await withRetry(() => axios.get(url, {
      timeout: TIMEOUT,
      httpsAgent: chesscomAgent,
      headers: DEFAULT_HEADERS
    }));
    const result = fromChesscom(data);
    if (result) setCached(url, result);
    return result;
  } catch (err) {
    if (err.response?.status === 403) {
      if (!chesscomBlockedUntil.value) {
        logger.warn('Chess.com API blocked (403) — will skip for 5 minutes');
      }
      blockChesscom();
    } else {
      logger.warn('Chess.com daily failed:', err.message);
    }
    return null;
  }
}

async function fetchChesscomRandom() {
  const url = `${CHESSCOM_API}/random`;
  if (isChesscomBlocked()) return null;
  try {
    const { data } = await withRetry(() => axios.get(url, {
      timeout: QUICK_TIMEOUT,
      httpsAgent: chesscomAgent,
      headers: DEFAULT_HEADERS
    }));
    return fromChesscom(data);
  } catch (err) {
    if (err.response?.status === 403) {
      if (!chesscomBlockedUntil.value) {
        logger.warn('Chess.com API blocked (403) — will skip for 5 minutes');
      }
      blockChesscom();
    } else {
      logger.warn('Chess.com random failed:', err.message);
    }
    return null;
  }
}

function extractPgnSolution(pgn, puzzleFen) {
  const allMoves = parsePgnMoves(pgn);
  if (allMoves.length === 0) return [];
  try {
    const puzzleChess = new Chess(puzzleFen);
    const puzzlePos = puzzleChess.fen().split(' ').slice(0, 4).join(' ');
    const game = new Chess();
    for (let i = 0; i < allMoves.length; i++) {
      try {
        const result = game.move(allMoves[i], { sloppy: true });
        if (!result) continue;
        const currentPos = game.fen().split(' ').slice(0, 4).join(' ');
        if (currentPos === puzzlePos) {
          const solution = allMoves.slice(i + 1);
          return solution.length > 0 ? solution : allMoves.slice(0, 12);
        }
      } catch {}
    }
  } catch {}
  return allMoves.slice(0, 12);
}

function fromChesscom(d) {
  const fen = d.fen;
  if (!fen) return null;
  const pgn = d.pgn || '';
  const moves = extractPgnSolution(pgn, fen);
  if (moves.length === 0) return null;
  const chess = new Chess(fen);
  const isMate = moves.some(m => m.includes('#'));
  const playerSide = chess.turn();
  const rating = estimateRating(fen, moves, isMate);
  const theme = detectTheme(fen, moves, isMate);
  return validatePuzzle({
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
  });
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

function validatePuzzle(puzzle) {
  if (!puzzle || !puzzle.fen || !puzzle.solution || puzzle.solution.length === 0) return null;
  try {
    const chess = new Chess(puzzle.fen);
    const turn = chess.turn();
    if (puzzle.playerSide && puzzle.playerSide !== turn) return null;
    const firstMove = puzzle.solution[0];
    try {
      chess.move(firstMove, { sloppy: true });
    } catch {
      const match = chess.moves().filter(m => m.toLowerCase().startsWith(firstMove.toLowerCase()));
      if (match.length !== 1) return null;
      puzzle.solution[0] = match[0];
    }
    return puzzle;
  } catch {
    return null;
  }
}

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
  const maxAttempts = Math.min(count * 2, 10);
  for (let i = 0; i < maxAttempts; i++) {
    if (puzzles.length >= count) break;
    try {
      const p = await fetchChesscomRandom();
      if (p && !seen.has(p.fen)) {
        seen.add(p.fen);
        puzzles.push(p);
      }
    } catch {
      break;
    }
  }
  if (puzzles.length === 0) {
    const daily = await fetchLichessDaily();
    if (daily && !seen.has(daily.fen)) {
      puzzles.push(daily);
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
