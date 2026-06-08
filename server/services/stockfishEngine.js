const initEngine = require('stockfish');
const { Chess } = require('./pgnParserService');

let engineInstance = null;
let initPromise = null;
let commandChain = Promise.resolve();

/**
 * Singleton Stockfish WASM engine (UCI).
 */
async function getEngine() {
  if (engineInstance) return engineInstance;

  if (!initPromise) {
    initPromise = initEngine('lite-single').then((engine) => {
      engineInstance = engine;
      return waitForReady(engine);
    });
  }

  return initPromise;
}

function waitForReady(engine) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Stockfish init timeout')), 30000);

    engine.listener = (line) => {
      if (line === 'uciok') {
        engine.sendCommand('isready');
      } else if (line === 'readyok') {
        clearTimeout(timeout);
        engine.listener = () => {};
        resolve(engine);
      }
    };

    engine.sendCommand('uci');
  });
}

function runEngineCommand(engine, run) {
  commandChain = commandChain.then(() => run(engine));
  return commandChain;
}

/**
 * Analyze a FEN position. Returns centipawns (white POV), best UCI move, PV.
 */
async function analyzeFen(fen, depth = 10) {
  const engine = await getEngine();
  const searchDepth = Math.min(Math.max(depth, 6), 18);

  return runEngineCommand(engine, (eng) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Stockfish analysis timeout'));
    }, 60000);

    let evalCp = 0;
    let isMate = false;
    let mateIn = 0;
    let bestMoveUci = null;
    let pv = [];
    let lastDepth = 0;

    eng.listener = (line) => {
      if (line.startsWith('info') && line.includes('depth')) {
        const depthMatch = line.match(/\bdepth (\d+)/);
        if (depthMatch) lastDepth = parseInt(depthMatch[1], 10);

        const cpMatch = line.match(/\bscore cp (-?\d+)/);
        const mateMatch = line.match(/\bscore mate (-?\d+)/);

        if (mateMatch && lastDepth >= searchDepth - 1) {
          isMate = true;
          mateIn = parseInt(mateMatch[1], 10);
          evalCp = mateIn > 0 ? 10000 - Math.abs(mateIn) * 50 : -10000 + Math.abs(mateIn) * 50;
        } else if (cpMatch && lastDepth >= searchDepth - 1) {
          isMate = false;
          evalCp = parseInt(cpMatch[1], 10);
        }

        const pvMatch = line.match(/\bpv (.+)$/);
        if (pvMatch) pv = pvMatch[1].trim().split(/\s+/);
      }

      if (line.startsWith('bestmove')) {
        clearTimeout(timeout);
        const parts = line.split(/\s+/);
        bestMoveUci = parts[1] && parts[1] !== '(none)' ? parts[1] : null;

        eng.onDoneSearching = () => {};
        resolve({
          evalCp,
          isMate,
          mateIn,
          bestMoveUci,
          bestMoveSan: uciToSan(fen, bestMoveUci),
          pv,
          depth: lastDepth || searchDepth
        });
      }
    };

    eng.onDoneSearching = () => {};
    eng.sendCommand(`position fen ${fen}`);
    eng.sendCommand(`go depth ${searchDepth}`);
  }));
}

function uciToSan(fen, uci) {
  if (!uci || uci.length < 4) return null;
  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined
    });
    return move ? move.san : uci;
  } catch {
    return uci;
  }
}

function quit() {
  if (engineInstance) {
    try {
      engineInstance.sendCommand('quit');
    } catch {
      // ignore
    }
    engineInstance = null;
    initPromise = null;
  }
}

module.exports = {
  analyzeFen,
  uciToSan,
  quit
};
