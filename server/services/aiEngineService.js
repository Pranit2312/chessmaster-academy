const { Chess } = require('chess.js');
const { analyzeFen } = require('./stockfishEngine');
const AiPuzzle = require('../models/AiPuzzle');

const DIFFICULTY_MAP = {
  1:  { elo: 200,  depth: 4,  label: 'Beginner' },
  2:  { elo: 400,  depth: 6,  label: 'Novice' },
  3:  { elo: 600,  depth: 8,  label: 'Casual' },
  4:  { elo: 800,  depth: 10, label: 'Developing' },
  5:  { elo: 1000, depth: 12, label: 'Intermediate' },
  6:  { elo: 1200, depth: 14, label: 'Club Player' },
  7:  { elo: 1400, depth: 16, label: 'Strong Club' },
  8:  { elo: 1600, depth: 18, label: 'Advanced' },
  9:  { elo: 1800, depth: 20, label: 'Expert' },
  10: { elo: 2000, depth: 22, label: 'Candidate Master' },
  11: { elo: 2100, depth: 24, label: 'FIDE Master' },
  12: { elo: 2200, depth: 26, label: 'International Master' },
  13: { elo: 2300, depth: 28, label: 'Grandmaster' },
  14: { elo: 2400, depth: 30, label: 'Super GM' },
  15: { elo: 2500, depth: 30, label: 'Elite' },
  16: { elo: 2600, depth: 30, label: 'World Class' },
  17: { elo: 2700, depth: 30, label: 'Top 100' },
  18: { elo: 2800, depth: 30, label: 'Top 10' },
  19: { elo: 2900, depth: 30, label: 'World Champion' },
  20: { elo: 3000, depth: 30, label: 'Perfect Play' }
};

function safeWrite(eng, command) {
  try {
    if (eng && !eng.killed && eng.stdin && eng.exitCode === null) {
      eng.stdin.write(command + '\n');
      return true;
    }
  } catch (err) {
    if (err.code === 'EPIPE' || err.code === 'ECONNRESET' || (err.message && err.message.includes('Broken pipe'))) {
      // silently skip during shutdown
    }
  }
  return false;
}

const engine = (() => {
  let nativeEngine = null;

  return {
    async getEngine() {
      if (nativeEngine) return nativeEngine;
      const path = require('path');
      const fs = require('fs');
      const { spawn } = require('child_process');

      const enginePath = path.join(__dirname, '..', 'engines', 'stockfish.exe');
      if (!fs.existsSync(enginePath)) return null;

      return new Promise((resolve) => {
        try {
          const eng = spawn(enginePath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
          eng.on('error', () => {});
          eng.stdin.on('error', () => {});
          let buffer = '';
          const onData = (data) => {
            buffer += data.toString();
            if (buffer.includes('readyok')) {
              eng.stdout.removeListener('data', onData);
              nativeEngine = eng;
              resolve(eng);
            }
          };
          eng.stdout.on('data', onData);
          safeWrite(eng, 'uci');
          safeWrite(eng, 'isready');
          setTimeout(() => resolve(eng), 2000);
        } catch {
          resolve(null);
        }
      });
    },

    setSkillLevel(eng, elo) {
      safeWrite(eng, `setoption name UCI_LimitStrength value true`);
      safeWrite(eng, `setoption name UCI_Elo value ${elo}`);
    },

    setFullStrength(eng) {
      safeWrite(eng, `setoption name UCI_LimitStrength value false`);
    }
  };
})();

async function getBotMove(fen, difficulty) {
  const chess = new Chess(fen);
  if (chess.isGameOver()) {
    return { move: null, gameOver: true, result: getGameResult(chess) };
  }

  const config = DIFFICULTY_MAP[difficulty] || DIFFICULTY_MAP[5];
  const eng = await engine.getEngine();

  if (eng) {
    return await getNativeBotMove(eng, chess, config, difficulty);
  }

  return await getWasmBotMove(chess, config, difficulty);
}

async function getNativeBotMove(eng, chess, config) {
  const fen = chess.fen();

  if (config.elo <= 200) {
    engine.setSkillLevel(eng, 1320);
    const moves = chess.moves();
    if (moves.length > 0) {
      const move = moves[Math.floor(Math.random() * Math.min(moves.length, 3))];
      chess.move(move);
      return {
        move: { san: move, fen: chess.fen(), by: 'bot', eval: 0, depth: 1 },
        gameOver: chess.isGameOver(),
        result: chess.isGameOver() ? getGameResult(chess) : null
      };
    }
  }

  engine.setSkillLevel(eng, Math.min(config.elo, 3200));

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(getFallbackMove(chess));
    }, 30000);

    let buffer = '';
    let bestMoveUci = null;
    let evalCp = 0;
    let lastDepth = 0;

    const onData = (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;

        if (t.includes('score cp')) {
          const m = t.match(/score cp (-?\d+)/);
          if (m) evalCp = parseInt(m[1]);
        }
        if (t.includes('depth')) {
          const m = t.match(/\bdepth (\d+)/);
          if (m) lastDepth = parseInt(m[1]);
        }
        if (t.startsWith('bestmove')) {
          clearTimeout(timeout);
          try { eng.stdout.removeListener('data', onData); } catch {}
          const parts = t.split(/\s+/);
          bestMoveUci = parts[1] && parts[1] !== '(none)' ? parts[1] : null;

          if (bestMoveUci) {
            try {
              const move = chess.move({ from: bestMoveUci.slice(0, 2), to: bestMoveUci.slice(2, 4), promotion: bestMoveUci.length > 4 ? bestMoveUci[4] : undefined });
              resolve({
                move: { san: move.san, uci: bestMoveUci, fen: chess.fen(), by: 'bot', eval: evalCp, depth: lastDepth },
                gameOver: chess.isGameOver(),
                result: chess.isGameOver() ? getGameResult(chess) : null
              });
            } catch {
              resolve(getFallbackMove(chess));
            }
          } else {
            resolve(getFallbackMove(chess));
          }
        }
      }
    };

    eng.stdout.on('data', onData);
    safeWrite(eng, `position fen ${fen}`);

    const moveTime = Math.min(500 + config.depth * 100, 5000);
    safeWrite(eng, `go movetime ${moveTime}`);
  });
}

async function getWasmBotMove(chess, config, difficulty) {
  const fen = chess.fen();

  if (difficulty <= 3) {
    const moves = chess.moves();
    if (moves.length > 0) {
      const move = moves[Math.floor(Math.random() * Math.min(moves.length, 3))];
      chess.move(move);
      return {
        move: { san: move, fen: chess.fen(), by: 'bot', eval: 0 },
        gameOver: chess.isGameOver(),
        result: chess.isGameOver() ? getGameResult(chess) : null
      };
    }
  }

  try {
    const result = await analyzeFen(fen, config.depth);
    const noisyEval = result.evalCp + (Math.random() - 0.5) * (300 - difficulty * 15);

    if (result.bestMoveUci) {
      try {
        const uci = result.bestMoveUci;
        const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
        return {
          move: { san: move.san, uci, fen: chess.fen(), by: 'bot', eval: noisyEval, depth: config.depth },
          gameOver: chess.isGameOver(),
          result: chess.isGameOver() ? getGameResult(chess) : null
        };
      } catch {}
    }
  } catch {}

  return getFallbackMove(chess);
}

function getFallbackMove(chess) {
  const moves = chess.moves();
  if (moves.length === 0) {
    return { move: null, gameOver: true, result: getGameResult(chess) };
  }
  const move = moves[Math.floor(Math.random() * moves.length)];
  chess.move(move);
  return {
    move: { san: move, fen: chess.fen(), by: 'bot', eval: 0 },
    gameOver: chess.isGameOver(),
    result: chess.isGameOver() ? getGameResult(chess) : null
  };
}

function getGameResult(chess) {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? 'black_win' : 'white_win';
  if (chess.isDraw() || chess.isStalemate()) return 'draw';
  return 'draw';
}

async function generatePuzzleFromAnalysis(analysisDoc, userId) {
  const puzzles = [];
  const mistakeMoves = analysisDoc.moves.filter(m => m.isMistake && m.lossOfEval >= 150);

  for (const mistake of mistakeMoves.slice(0, 5)) {
    const chess = new Chess(mistake.fen);
    if (chess.isGameOver() || chess.moves().length === 0) continue;

    const playerSide = chess.turn();
    try {
      const result = await analyzeFen(mistake.fen, 14);
      if (result.bestMoveUci && result.evalCp > 50) {
        const lossValue = mistake.lossOfEval || 100;
        let difficulty = 'medium';
        let rating = 1200;
        if (lossValue >= 400) { difficulty = 'easy'; rating = 800; }
        else if (lossValue >= 200) { difficulty = 'medium'; rating = 1200; }
        else if (lossValue >= 100) { difficulty = 'hard'; rating = 1600; }
        else { difficulty = 'expert'; rating = 2000; }

        const tacticType = detectTacticType(chess);

        puzzles.push({
          fen: mistake.fen,
          solution: [result.bestMoveSan],
          theme: tacticType,
          difficulty,
          rating,
          source: 'from_game',
          sourceGame: analysisDoc._id,
          sourceUser: userId,
          playerSide,
          description: `Tactical opportunity from ${analysisDoc.whitePlayer || 'Unknown'} vs ${analysisDoc.blackPlayer || 'Unknown'}`,
          hint: `Look for a winning move.${tacticType !== 'tactic' ? ` Theme: ${tacticType}` : ''}`,
          tags: [tacticType, difficulty, 'generated']
        });
      }
    } catch { continue; }
  }

  return puzzles;
}

function detectTacticType(chess) {
  let captures = 0, checks = 0;
  for (const move of chess.moves({ verbose: true })) {
    if (move.flags.includes('c') || move.flags.includes('e')) captures++;
    if (move.san.includes('+') || move.san.includes('#')) checks++;
  }
  if (captures >= 3 && checks >= 1) return 'discovered_attack';
  if (captures >= 2) return 'fork';
  if (checks >= 2) return 'attraction';
  if (captures >= 1 && checks >= 1) return 'sacrifice';
  if (captures >= 1 && captures <= 2) return 'pin';
  return 'tactic';
}

async function generateDailyPuzzle() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyPuzzle = await AiPuzzle.findOne({ source: 'daily', createdAt: { $gte: today } });
  if (dailyPuzzle) return dailyPuzzle;

  const puzzle = await AiPuzzle.findOne({ isActive: true, source: { $ne: 'daily' } })
    .sort({ timesSolved: 1, createdAt: -1 });

  if (!puzzle) {
    return await AiPuzzle.findOne({ isActive: true }).sort({ createdAt: -1 });
  }

  return await AiPuzzle.create({
    fen: puzzle.fen, solution: puzzle.solution, theme: puzzle.theme,
    difficulty: puzzle.difficulty, rating: puzzle.rating, source: 'daily',
    playerSide: puzzle.playerSide, description: puzzle.description,
    hint: puzzle.hint, tags: puzzle.tags
  });
}

module.exports = {
  getBotMove,
  generatePuzzleFromAnalysis,
  generateDailyPuzzle,
  detectTacticType,
  DIFFICULTY_MAP
};
