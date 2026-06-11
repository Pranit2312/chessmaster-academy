const https = require('https');
const readline = require('readline');
const mongoose = require('mongoose');
const path = require('path');
const { Chess } = require('chess.js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Puzzle = require('../models/Puzzle');
const CSV_URL = 'https://database.lichess.org/lichess_db_puzzle.csv';
const TARGET = parseInt(process.argv[2]) || 100000;
const BATCH_SIZE = 100;

function parseThemes(str) {
  if (!str || !str.trim()) return [];
  return str.trim().split(/\s+/).map(t => t.trim().toLowerCase()).filter(Boolean);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await Puzzle.countDocuments({});
  console.log(`Existing puzzles: ${existing}, target: ${TARGET}`);
  if (existing >= TARGET) { console.log('Already enough'); process.exit(0); }

  console.log(`Stream-importing up to ${TARGET} puzzles...`);
  console.log(`CSV URL: ${CSV_URL}`);
  console.log('');

  await new Promise((resolve, reject) => {
    https.get(CSV_URL, { timeout: 60000 }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let total = 0, skipped = 0, errors = 0, batch = [];
      let header = true, startTime = Date.now(), downloaded = 0;

      res.on('data', c => downloaded += c.length);

      const rl = readline.createInterface({ input: res, crlfDelay: Infinity });

      rl.on('line', async (line) => {
        if (header) { header = false; return; }
        if (total >= TARGET) return;

        const parts = line.split(',');
        if (parts.length < 8) { skipped++; return; }
        const puzzleId = parts[0].trim();
        if (!puzzleId) { skipped++; return; }

        try {
          const fen = parts[1].trim();
          const movesStr = parts[2].trim();
          const moves = movesStr.split(/\s+/).filter(Boolean);
          if (moves.length === 0) { skipped++; return; }

          const chess = new Chess(fen);
          const solution = moves.map(m => {
            try { return chess.move({ from: m.slice(0,2), to: m.slice(2,4), promotion: m[4] }).san; }
            catch { return m; }
          });

          batch.push({
            puzzleId, fen, solution,
            rating: Math.max(200, Math.min(3500, parseInt(parts[3]) || 1500)),
            popularity: parseInt(parts[5]) || 0,
            nbPlays: parseInt(parts[6]) || 0,
            themes: parseThemes(parts[7]),
            openingTags: parseThemes(parts[9]),
            source: 'lichess',
            playerSide: fen.split(' ')[1] === 'w' ? 'w' : 'b',
            isActive: true,
            solvedCount: 0, avgSolveTime: 0
          });
          total++;

          if (batch.length >= BATCH_SIZE) {
            rl.pause();
            const b = batch; batch = [];
            await Puzzle.bulkWrite(
              b.map(p => ({ updateOne: { filter: { puzzleId: p.puzzleId }, update: { $setOnInsert: p }, upsert: true } })),
              { ordered: false }
            ).catch(() => {});
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            process.stdout.write(`\r  ${total.toLocaleString()} puzzles | ${skipped} skipped | ${elapsed}s`);
            rl.resume();
          }
        } catch { errors++; }
      });

      rl.on('close', async () => {
        if (batch.length > 0) {
          await Puzzle.bulkWrite(
            batch.map(p => ({ updateOne: { filter: { puzzleId: p.puzzleId }, update: { $setOnInsert: p }, upsert: true } })),
            { ordered: false }
          ).catch(() => {});
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n');
        console.log('='.repeat(50));
        console.log(`Imported: ${total} | Skipped: ${skipped} | Errors: ${errors} | Time: ${elapsed}s`);
        const cnt = await Puzzle.countDocuments({});
        console.log(`Total in DB: ${cnt}`);
        resolve();
      });
    });
  });

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
