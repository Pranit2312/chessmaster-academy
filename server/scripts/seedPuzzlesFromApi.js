const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Puzzle = require('../models/Puzzle');
const puzzleApi = require('../services/puzzleApiService');

const TARGET = parseInt(process.argv[2]) || 500;
const CONCURRENCY = 3;
const SEEN = new Set();

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchOne() {
  const p = await puzzleApi.fetchRandomPuzzle();
  if (!p || SEEN.has(p.fen)) return null;
  SEEN.add(p.fen);
  return {
    puzzleId: p.fen,
    fen: p.fen,
    solution: p.solution || [],
    rating: p.rating || 1200,
    popularity: p.popularity || 0,
    nbPlays: p.nbPlays || 0,
    themes: p.themes || [p.theme].filter(Boolean),
    source: p.source || 'chesscom',
    playerSide: p.playerSide || 'w',
    isActive: true,
    solvedCount: 0,
    avgSolveTime: 0
  };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Seeding ${TARGET} puzzles from API (concurrency: ${CONCURRENCY})...`);

  const existingCount = await Puzzle.countDocuments({});
  console.log(`Existing puzzles in DB: ${existingCount}`);
  if (existingCount >= TARGET) {
    console.log('Already have enough puzzles. Skipping.');
    process.exit(0);
  }

  let inserted = 0;
  let attempts = 0;
  const maxAttempts = TARGET * 5;

  while (inserted < TARGET && attempts < maxAttempts) {
    attempts++;
    const batch = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      batch.push(fetchOne());
    }
    const results = await Promise.all(batch);

    for (const doc of results) {
      if (!doc) continue;
      try {
        await Puzzle.updateOne(
          { puzzleId: doc.puzzleId },
          { $setOnInsert: doc },
          { upsert: true }
        );
        inserted++;
      } catch {}
    }

    if (attempts % 10 === 0) {
      process.stdout.write(`\r  Fetched: ${inserted}/${TARGET} (attempts: ${attempts})`);
    }
  }

  console.log(`\nDone. Inserted ${inserted} puzzles in ${attempts} attempts.`);
  const finalCount = await Puzzle.countDocuments({});
  console.log(`Total puzzles in DB: ${finalCount}`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => { console.error('FAIL:', err); process.exit(1); });
