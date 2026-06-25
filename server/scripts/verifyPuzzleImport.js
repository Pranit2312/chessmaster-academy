const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Chess } = require('chess.js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Puzzle = require('../models/Puzzle');

const CSV_PATH = path.join(__dirname, '..', 'data', 'lichess_puzzle_transformed.csv');

function countCsvRows(filePath) {
  return new Promise((resolve, reject) => {
    const readline = require('readline');
    const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
    let count = 0;
    rl.on('line', () => count++);
    rl.on('close', () => resolve(count - 1));
    rl.on('error', reject);
  });
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB: ${mongoose.connection.db.databaseName}\n`);

  // CSV row count
  let csvRows = 0;
  if (fs.existsSync(CSV_PATH)) {
    csvRows = await countCsvRows(CSV_PATH);
    console.log(`CSV rows (excl. header): ${csvRows.toLocaleString()}`);
  } else {
    console.log(`CSV not found at: ${CSV_PATH}`);
  }

  // Database counts
  const totalDb = await Puzzle.countDocuments({});
  const activeDb = await Puzzle.countDocuments({ isActive: true });
  console.log(`DB total puzzles:        ${totalDb.toLocaleString()}`);
  console.log(`DB active puzzles:       ${activeDb.toLocaleString()}`);

  // Missing rows (CSV count - DB count)
  if (csvRows > 0) {
    const missing = csvRows - totalDb;
    console.log(`Missing rows (CSV - DB): ${missing > 0 ? missing.toLocaleString() : 0}${missing < 0 ? ` (DB has ${Math.abs(missing).toLocaleString()} more than CSV)` : ''}`);
  }

  // Duplicate puzzleIds
  const duplicates = await Puzzle.aggregate([
    { $group: { _id: '$puzzleId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'total' }
  ]);
  const dupCount = duplicates[0]?.total || 0;
  console.log(`Duplicate puzzleIds:     ${dupCount.toLocaleString()}`);

  // Failed rows — check for null FENs or empty solutions
  const failed = await Puzzle.countDocuments({
    $or: [
      { fen: { $in: [null, ''] } },
      { solution: { $in: [null, []] } },
      { puzzleId: { $in: [null, ''] } }
    ]
  });
  console.log(`Failed/invalid docs:     ${failed.toLocaleString()}`);

  // Validate FENs with chess.js
  console.log('\nValidating FENs with chess.js (sampling up to 1000)...');
  const sample = await Puzzle.aggregate([{ $match: { isActive: true } }, { $sample: { size: 1000 } }]);
  let invalidFens = 0;
  for (const p of sample) {
    try { new Chess(p.fen); } catch { invalidFens++; }
  }
  console.log(`  Sampled: ${sample.length}, Invalid FENs: ${invalidFens}`);

  // Themes
  const themeDistinct = await Puzzle.distinct('themes', { isActive: true });
  const sortedThemes = (themeDistinct || []).filter(Boolean).sort();
  console.log(`\nUnique themes:           ${sortedThemes.length}`);
  console.log(`Themes: ${sortedThemes.join(', ')}`);

  // Rating range
  const ratingStats = await Puzzle.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, min: { $min: '$rating' }, max: { $max: '$rating' }, avg: { $avg: '$rating' } } }
  ]);
  if (ratingStats[0]) {
    console.log(`\nRating range: ${ratingStats[0].min} - ${ratingStats[0].max}`);
    console.log(`Avg rating:   ${Math.round(ratingStats[0].avg)}`);
  }

  // RatingDeviation
  const rdStats = await Puzzle.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, min: { $min: '$ratingDeviation' }, max: { $max: '$ratingDeviation' }, avg: { $avg: '$ratingDeviation' } } }
  ]);
  if (rdStats[0]) {
    console.log(`RatingDeviation: ${rdStats[0].min} - ${rdStats[0].max} (avg ${Math.round(rdStats[0].avg)})`);
  }

  // Database size
  const dbStats = await mongoose.connection.db.stats();
  // dbStats.dataSize is total for the whole DB; approximate puzzle collection separately
  const collNames = await mongoose.connection.db.listCollections().toArray();
  let puzzleSize = 0;
  for (const c of collNames) {
    if (c.name === 'puzzles') {
      const collStats = await mongoose.connection.db.command({ collStats: 'puzzles' });
      puzzleSize = collStats.size;
      break;
    }
  }
  if (puzzleSize > 0) {
    console.log(`\nPuzzle collection size:  ${(puzzleSize / 1024 / 1024).toFixed(1)} MB`);
  }
  console.log(`Total DB size:           ${(dbStats.dataSize / 1024 / 1024).toFixed(1)} MB`);

  // Most/least played
  const mostPlayed = await Puzzle.findOne({ isActive: true }).sort({ nbPlays: -1 }).lean();
  const leastPlayed = await Puzzle.findOne({ isActive: true }).sort({ nbPlays: 1 }).lean();
  if (mostPlayed) {
    console.log(`\nMost played:  ${mostPlayed.nbPlays.toLocaleString()} plays (${mostPlayed.puzzleId}, rating ${mostPlayed.rating})`);
  }
  if (leastPlayed) {
    console.log(`Least played: ${leastPlayed.nbPlays.toLocaleString()} plays (${leastPlayed.puzzleId}, rating ${leastPlayed.rating})`);
  }

  // Puzzles with ratingDeviation > 0
  const ratedCount = await Puzzle.countDocuments({ isActive: true, ratingDeviation: { $gt: 0 } });
  console.log(`\nPuzzles with ratingDeviation > 0: ${ratedCount.toLocaleString()}`);

  await mongoose.connection.close();
  console.log('\nVerification complete.');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
