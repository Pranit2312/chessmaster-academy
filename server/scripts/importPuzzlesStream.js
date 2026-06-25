const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const { Chess } = require('chess.js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Puzzle = require('../models/Puzzle');

const CSV_PATH = path.join(__dirname, '..', 'data', 'lichess_puzzle_transformed.csv');
const PROGRESS_FILE = path.join(__dirname, '..', 'data', '.import-progress');
const BATCH_SIZE = 5000;
const MAX_RECORDS = parseInt(process.argv[2]) || Infinity;

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
    const result = [];
    for (const m of uciMoves) {
      if (m.length < 4) return null;
      try {
        const mv = chess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] || undefined });
        result.push(mv.san);
      } catch {
        return null;
      }
    }
    return result;
  } catch {
    return null;
  }
}

function getLastImportedId() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return fs.readFileSync(PROGRESS_FILE, 'utf-8').trim();
    }
  } catch {}
  return null;
}

function saveProgress(puzzleId) {
  try {
    fs.writeFileSync(PROGRESS_FILE, puzzleId, 'utf-8');
  } catch {}
}

function clearProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  } catch {}
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`);
    console.error('Expected at: server/data/lichess_puzzle_transformed.csv');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB: ${mongoose.connection.db.databaseName}`);

  const resumeId = getLastImportedId();
  let resumeMode = false;
  if (resumeId) {
    console.log(`Resume mode: skipping rows before puzzleId "${resumeId}"`);
    resumeMode = true;
  }

  const fileSize = fs.statSync(CSV_PATH).size;
  console.log(`File: ${CSV_PATH} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`Batch size: ${BATCH_SIZE.toLocaleString()}`);
  console.log(`Max records: ${MAX_RECORDS === Infinity ? 'unlimited' : MAX_RECORDS.toLocaleString()}`);
  console.log('');

  let total = 0;
  let skipped = 0;
  let errors = 0;
  let insertedCount = 0;
  let batch = [];
  let startTime = Date.now();
  let foundResume = !resumeId;

  await new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(CSV_PATH, { highWaterMark: 64 * 1024 })
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim(),
        skipLines: 0
      }));

    readStream.on('data', async (row) => {
      if (total >= MAX_RECORDS) {
        readStream.destroy();
        return;
      }

      if (!foundResume) {
        if (row.PuzzleId === resumeId) {
          foundResume = true;
        }
        return;
      }

      readStream.pause();

      try {
        const puzzleId = (row.PuzzleId || '').trim();
        if (!puzzleId) { skipped++; readStream.resume(); return; }

        const fen = (row.FEN || '').trim();
        if (!fen) { skipped++; readStream.resume(); return; }

        const movesStr = (row.Moves || '').trim();
        const rawMoves = parseMoves(movesStr);
        if (rawMoves.length === 0) { skipped++; readStream.resume(); return; }

        const rating = Math.max(200, Math.min(3500, parseInt(row.Rating) || 1500));
        const ratingDeviation = Math.max(0, parseInt(row.RatingDeviation) || 0);
        const popularity = Math.max(0, parseInt(row.Popularity) || 0);
        const nbPlays = parseInt(row.NbPlays) || 0;
        const themes = parseThemes(row.Themes);
        const gameUrl = (row.GameUrl || '').trim();

        const solution = uciToSan(fen, rawMoves);
        if (!solution) { skipped++; readStream.resume(); return; }

        batch.push({
          puzzleId,
          fen,
          solution,
          rating,
          ratingDeviation,
          popularity,
          nbPlays,
          themes,
          openingTags: [],
          gameUrl,
          playerSide: fen.split(' ')[1] === 'w' ? 'w' : 'b',
          isActive: true,
          solvedCount: 0,
          avgSolveTime: 0
        });

        total++;

        if (batch.length >= BATCH_SIZE) {
          const b = batch;
          batch = [];
          const result = await flushBatch(b);
          insertedCount += result.upserted;
          saveProgress(puzzleId);
          reportProgress(total, skipped, errors, insertedCount, startTime, fileSize);
        }
      } catch (err) {
        errors++;
      }

      readStream.resume();
    });

    readStream.on('end', async () => {
      if (batch.length > 0) {
        const result = await flushBatch(batch);
        insertedCount += result.upserted;
        batch = [];
      }
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log('\n');
      console.log('='.repeat(50));
      console.log('STREAM IMPORT COMPLETE');
      console.log('='.repeat(50));
      console.log(`  Total processed: ${total.toLocaleString()}`);
      console.log(`  New inserted:    ${insertedCount.toLocaleString()}`);
      console.log(`  Skipped (invalid): ${skipped.toLocaleString()}`);
      console.log(`  Errors:          ${errors}`);
      console.log(`  Time:            ${elapsed}s`);
      console.log(`  Speed:           ${(total / elapsed).toFixed(0)} rows/s`);
      resolve();
    });

    readStream.on('error', (err) => {
      if (err.message.includes('destroy')) {
        console.log('\n  Hit max records, finalizing...');
      } else {
        reject(err);
      }
    });
  });

  if (total > 0) clearProgress();
  const finalCount = await Puzzle.countDocuments({});
  console.log(`  Total in DB: ${finalCount.toLocaleString()}`);

  const stats = await Puzzle.aggregate([
    { $group: { _id: null, minRating: { $min: '$rating' }, maxRating: { $max: '$rating' }, avgRating: { $avg: '$rating' }, totalPlays: { $sum: '$nbPlays' } } }
  ]);
  if (stats[0]) {
    console.log(`  Rating:      ${stats[0].minRating} - ${stats[0].maxRating} (avg ${Math.round(stats[0].avgRating)})`);
  }

  const themeCount = await Puzzle.distinct('themes');
  console.log(`  Themes:      ${themeCount.length.toLocaleString()} unique`);

  const collStats = await mongoose.connection.db.command({ collStats: 'puzzles' });
  console.log(`  DB size:     ${(collStats.size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Index size:  ${(collStats.totalIndexSize / 1024 / 1024).toFixed(1)} MB`);

  await mongoose.connection.close();
  console.log('Done.');
}

async function flushBatch(batch) {
  const ops = batch.map(puzzle => ({
    updateOne: {
      filter: { puzzleId: puzzle.puzzleId },
      update: { $setOnInsert: puzzle },
      upsert: true
    }
  }));
  try {
    const result = await Puzzle.bulkWrite(ops, { ordered: false });
    return { upserted: result.upsertedCount || 0, matched: result.matchedCount || 0 };
  } catch (err) {
    console.error(`\nBatch insert error: ${err.message}`);
    return { upserted: 0, matched: 0 };
  }
}

function reportProgress(total, skipped, errors, insertedCount, startTime, fileSize) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = total > 0 ? (total / elapsed).toFixed(0) : '?';
  process.stdout.write(`\r  Processed: ${total.toLocaleString()} | Inserted: ${insertedCount.toLocaleString()} | Skipped: ${skipped.toLocaleString()} | Rate: ${rate}/s`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
