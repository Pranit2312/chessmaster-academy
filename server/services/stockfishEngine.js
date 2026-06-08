const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Chess } = require('chess.js');

const ENGINE_PATH = path.join(__dirname, '..', 'engines', 'stockfish.exe');
const ENGINE_THREADS = parseInt(process.env.STOCKFISH_THREADS || '2', 10);
const ENGINE_HASH = parseInt(process.env.STOCKFISH_HASH || '256', 10);
const MAX_DEPTH = parseInt(process.env.STOCKFISH_MAX_DEPTH || '30', 10);
const ANALYSIS_TIMEOUT = parseInt(process.env.STOCKFISH_TIMEOUT || '120000', 10);

let nativeEngine = null;
let engineLock = Promise.resolve();
let wasmEngine = null;
let usingNative = false;

function acquireLock() {
  let release;
  const wait = new Promise(resolve => { release = resolve; });
  const prev = engineLock;
  engineLock = prev.then(() => wait);
  return prev.then(() => release);
}

async function getEngine() {
  if (nativeEngine) return nativeEngine;
  if (wasmEngine) return wasmEngine;

  if (fs.existsSync(ENGINE_PATH)) {
    try {
      nativeEngine = await initNativeEngine();
      usingNative = true;
      console.log(`✅ Stockfish 16 native engine loaded (${ENGINE_THREADS} threads, ${ENGINE_HASH}MB hash)`);
      return nativeEngine;
    } catch (err) {
      console.warn('⚠️ Native Stockfish failed, falling back to WASM:', err.message);
      nativeEngine = null;
    }
  }

  try {
    const initWasm = require('stockfish');
    wasmEngine = await initWasm('lite-single');
    await waitForWasmReady(wasmEngine);
    console.log('✅ Stockfish WASM engine loaded (fallback mode)');
    return wasmEngine;
  } catch (err) {
    throw new Error('No Stockfish engine available: ' + err.message);
  }
}

function initNativeEngine() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Engine init timeout')), 30000);
    const engine = spawn(ENGINE_PATH, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    let buffer = '';
    let resolved = false;

    engine.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === 'readyok' && !resolved) {
          clearTimeout(timeout);
          resolved = true;
          resolve(engine);
        }
      }
    });

    engine.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    engine.stdin.write('uci\n');
    setTimeout(() => {
      engine.stdin.write('isready\n');
      engine.stdin.write(`setoption name Threads value ${ENGINE_THREADS}\n`);
      engine.stdin.write(`setoption name Hash value ${ENGINE_HASH}\n`);
    }, 500);
  });
}

function waitForWasmReady(engine) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WASM init timeout')), 30000);
    engine.listener = (line) => {
      if (line === 'uciok') engine.sendCommand('isready');
      else if (line === 'readyok') { clearTimeout(timeout); engine.listener = () => {}; resolve(engine); }
    };
    engine.sendCommand('uci');
  });
}

function sendCommand(engine, cmd) {
  return new Promise((resolve, reject) => {
    if (usingNative) {
      const onData = (data) => {
        const output = data.toString();
        resolve(output);
      };
      engine.stdout.once('data', onData);
      setTimeout(() => { engine.stdout.removeListener('data', onData); resolve(''); }, 100);
      engine.stdin.write(cmd + '\n');
    } else {
      const timeout = setTimeout(() => reject(new Error('WASM command timeout')), ANALYSIS_TIMEOUT);
      engine.listener = (line) => {
        if (line.startsWith('bestmove')) {
          clearTimeout(timeout);
          resolve(line);
        }
      };
      engine.sendCommand(cmd);
    }
  });
}

async function analyzeFen(fen, depth = 20, options = {}) {
  const release = await acquireLock();
  try {
    const engine = await getEngine();
    const searchDepth = Math.min(Math.max(depth, 4), MAX_DEPTH);
    const multiPv = options.multiPv || 1;

    if (usingNative) {
      return await analyzeNative(engine, fen, searchDepth, multiPv);
    } else {
      return await analyzeWasm(engine, fen, searchDepth);
    }
  } finally {
    release();
  }
}

function analyzeNative(engine, fen, depth, multiPv) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve({
        evalCp: 0, isMate: false, mateIn: 0,
        bestMoveUci: null, bestMoveSan: null, pv: [],
        depth: 0, topMoves: []
      });
    }, ANALYSIS_TIMEOUT);

    let result = {
      evalCp: 0, isMate: false, mateIn: 0,
      bestMoveUci: null, bestMoveSan: null, pv: [],
      depth: 0, topMoves: []
    };
    let buffer = '';

    const onData = (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('info') && trimmed.includes('depth')) {
          const depthMatch = trimmed.match(/\bdepth (\d+)/);
          const curDepth = depthMatch ? parseInt(depthMatch[1]) : 0;
          const cpMatch = trimmed.match(/\bscore cp (-?\d+)/);
          const mateMatch = trimmed.match(/\bscore mate (-?\d+)/);
          const pvMatch = trimmed.match(/\bpv (.+)$/);
          const multipvMatch = trimmed.match(/\bmultipv (\d+)/);
          const pvNum = multipvMatch ? parseInt(multipvMatch[1]) : 1;

          let evalCp = 0, isMate = false, mateIn = 0;
          if (mateMatch) { isMate = true; mateIn = parseInt(mateMatch[1]); evalCp = mateIn > 0 ? 10000 - Math.abs(mateIn) * 50 : -10000 + Math.abs(mateIn) * 50; }
          else if (cpMatch) evalCp = parseInt(cpMatch[1]);

          if (pvNum === 1 && curDepth >= depth - 1) {
            result.evalCp = evalCp;
            result.isMate = isMate;
            result.mateIn = mateIn;
            result.depth = curDepth;
          }

          if (pvMatch && pvNum === 1) {
            result.pv = pvMatch[1].trim().split(/\s+/);
            if (result.pv.length > 0) result.bestMoveUci = result.pv[0];
          }

          if (multiPv > 1) {
            const selMatch = trimmed.match(/\bseldepth (\d+)/);
            if (pvMatch) {
              const pvMoves = pvMatch[1].trim().split(/\s+/);
              const entry = {
                rank: pvNum, evalCp, isMate, mateIn,
                move: pvMoves[0] || null,
                pv: pvMoves,
                depth: curDepth
              };
              const existing = result.topMoves.findIndex(m => m.rank === pvNum);
              if (existing >= 0) result.topMoves[existing] = entry;
              else result.topMoves.push(entry);
            }
          }
        }

        if (trimmed.startsWith('bestmove')) {
          const parts = trimmed.split(/\s+/);
          const move = parts[1] && parts[1] !== '(none)' ? parts[1] : null;
          if (move) result.bestMoveUci = move;
        }
      }
    };

    const onBestMove = (data) => {
      const trimmed = data.toString().trim();
      if (trimmed.startsWith('bestmove')) {
        clearTimeout(timeout);
        engine.stdout.removeListener('data', onData);
        engine.stdout.removeListener('data', onBestMove);
        result.bestMoveSan = uciToSan(fen, result.bestMoveUci);
        result.topMoves.sort((a, b) => a.rank - b.rank);
        resolve(result);
      }
    };

    engine.stdout.on('data', onData);
    engine.stdout.on('data', onBestMove);

    if (multiPv > 1) engine.stdin.write(`setoption name MultiPV value ${multiPv}\n`);
    engine.stdin.write(`position fen ${fen}\n`);
    engine.stdin.write(`go depth ${depth}\n`);
  });
}

function analyzeWasm(engine, fen, depth) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('WASM analysis timeout'));
    }, 120000);

    let evalCp = 0, isMate = false, mateIn = 0, bestMoveUci = null, pv = [], lastDepth = 0;

    engine.listener = (line) => {
      if (line.startsWith('info') && line.includes('depth')) {
        const dm = line.match(/\bdepth (\d+)/);
        if (dm) lastDepth = parseInt(dm[1]);
        const cm = line.match(/\bscore cp (-?\d+)/);
        const mm = line.match(/\bscore mate (-?\d+)/);
        if (mm && lastDepth >= depth - 1) { isMate = true; mateIn = parseInt(mm[1]); evalCp = mateIn > 0 ? 10000 - Math.abs(mateIn) * 50 : -10000 + Math.abs(mateIn) * 50; }
        else if (cm && lastDepth >= depth - 1) { isMate = false; evalCp = parseInt(cm[1]); }
        const pm = line.match(/\bpv (.+)$/);
        if (pm) pv = pm[1].trim().split(/\s+/);
      }
      if (line.startsWith('bestmove')) {
        clearTimeout(timeout);
        const parts = line.split(/\s+/);
        bestMoveUci = parts[1] && parts[1] !== '(none)' ? parts[1] : null;
        engine.listener = () => {};
        resolve({ evalCp, isMate, mateIn, bestMoveUci, bestMoveSan: uciToSan(fen, bestMoveUci), pv, depth: lastDepth || depth, topMoves: [] });
      }
    };

    engine.sendCommand(`position fen ${fen}`);
    engine.sendCommand(`go depth ${depth}`);
  });
}

async function analyzeWithMultiPv(fen, depth = 20, numLines = 3) {
  return analyzeFen(fen, depth, { multiPv: numLines });
}

function uciToSan(fen, uci) {
  if (!uci || uci.length < 4) return null;
  try {
    const chess = new Chess(fen);
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
    return move ? move.san : uci;
  } catch { return uci; }
}

function quit() {
  if (nativeEngine) { try { nativeEngine.stdin.write('quit\n'); nativeEngine.kill(); } catch {} nativeEngine = null; }
  if (wasmEngine) { try { wasmEngine.sendCommand('quit'); } catch {} wasmEngine = null; }
}

module.exports = {
  analyzeFen,
  analyzeWithMultiPv,
  uciToSan,
  quit
};
