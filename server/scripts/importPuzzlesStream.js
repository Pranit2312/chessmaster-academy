const https = require('https');
const readline = require('readline');
const mongoose = require('mongoose');
const path = require('path');
const { Chess } = require('chess.js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Puzzle = require('../models/Puzzle');

const CSV_URL = 'https://database.lichess.org/lichess_db_puzzle.csv';
const TARGET = Math.min(parseInt(process.argv[2]) || 100000, 1000000);
const BATCH_SIZE = 500;

function parseThemes(str) {
  if (!str || !str.trim()) return [];
  return str.trim().split(/\s+/).map(t => t.trim().toLowerCase()).filter(Boolean);
}

function parseMoves(str) {
  if (!str || !str.trim()) return [];
  return str.trim().split(/\s+/).filter(Boolean);
}

function uciToSan(fen, uciMoves) {
  try {
    const chess = new Chess(fen);
    return uciMoves.map(m => {
      if (m.length < 4) return m;
      try {
        const mv = chess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] || undefined });
        return mv.san;
      } catch { return m; }
    });
  } catch { return uciMoves; }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Stream-importing up to ${TARGET.toLocaleString()} puzzles from Lichess CSV...`);
  console.log(`URL: ${CSV_URL}`);
  console.log('');

  const existing = await Puzzle.countDocuments({});
  if (existing >= TARGET) {
    console.log(`Already have ${existing} puzzles. Skipping download.`);
    process.exit(0);
  }

  return new Promise((resolve, reject) => {
    const req = https.get(CSV_URL, { timeout: 60000 }, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Download failed: HTTP ${res.statusCode}`);
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const totalSize = parseInt(res.headers['content-length'] || '0');
      let downloadedBytes = 0;
      let total = 0;
      let skipped = 0;
      let errors = 0;
      let batch = [];
      let headerSkipped = false;
      let startTime = Date.now();

      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
      });

      const rl = readline.createInterface({ input: res, crlfDelay: Infinity });

      rl.on('line', async (line) => {
        if (!headerSkipped) { headerSkipped = true; return; }
        if (total >= TARGET) return;

        const parts = line.split(',');
        if (parts.length < 8) { skipped++; return; }

        try {
          const puzzleId = parts[0].trim();
          if (!puzzleId) { skipped++; return; }

          const fen = parts[1].trim();
          const movesStr = parts[2].trim();
          const rating = parseInt(parts[3]) || 1500;
          const popularity = parseInt(parts[5]) || 0;
          const nbPlays = parseInt(parts[6]) || 0;
          const themes = parseThemes(parts[7]);
          const openingTags = parseThemes(parts[9]);

          const rawMoves = parseMoves(movesStr);
          if (rawMoves.length === 0) { skipped++; return; }

          const solution = uciToSan(fen, rawMoves);

          batch.push({
            puzzleId,
            fen,
            solution,
            rating: Math.max(200, Math.min(3500, rating)),
            popularity,
            nbPlays,
            themes,
            openingTags: [],
            source: 'lichess',
            playerSide: fen.split(' ')[1] === 'w' ? 'w' : 'b',
            isActive: true,
            solvedCount: 0,
            avgSolveTime: 0
          });

          total++;

          if (batch.length >= BATCH_SIZE) {
            rl.pause();
            const b = batch;
            batch = [];
            await flushBatch(b).catch(() => {});
            rl.resume();
            report(total, skipped, errors, startTime, totalSize, downloadedBytes);
          }
        } catch {
          errors++;
        }
      });

      rl.on('close', async () => {
        if (batch.length > 0) {
          await flushBatch(batch).catch(() => {});
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n');
        console.log('='.repeat(50));
        console.log('STREAM IMPORT COMPLETE');
        console.log('='.repeat(50));
        console.log(`  Imported:    ${total.toLocaleString()}`);
        console.log(`  Skipped:     ${skipped}`);
        console.log(`  Errors:      ${errors}`);
        console.log(`  Time:        ${elapsed}s`);
        const finalCount = await Puzzle.countDocuments({});
        console.log(`  Total in DB: ${finalCount.toLocaleString()}`);
        mongoose.connection.close();
        resolve();
      });

      rl.on('error', (err) => { reject(err); });
    });

    req.on('error', reject);
  });
}

async function flushBatch(batch) {
  const ops = batch.map(puzzle => ({
    updateOne: {
      filter: { puzzleId: puzzle.puzzleId },
      update: { $setOnInsert: puzzle },
      upsert: true
    }
  }));
  await Puzzle.bulkWrite(ops, { ordered: false });
}

function report(total, skipped, errors, startTime, totalSize, downloadedBytes) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = total > 0 ? (total / elapsed).toFixed(0) : '?';
  const pct = totalSize > 0 ? ((downloadedBytes / totalSize) * 100).toFixed(1) : '?';
  process.stdout.write(`\r  Imported: ${total.toLocaleString()} | Skipped: ${skipped} | Errors: ${errors} | Rate: ${rate}/s | Downloaded: ${pct}%   `);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
