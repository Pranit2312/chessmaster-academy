/**
 * Lichess Puzzle Dataset Importer
 *
 * Downloads and imports puzzles from:
 * https://database.lichess.org/#puzzles
 *
 * Usage:
 *   node server/scripts/importLichessPuzzles.js --file <path-to-csv> [--limit 100000]
 *   npm run import-puzzles
 *
 * CSV Format:
 *   PuzzleId,FEN,Moves,Rating,Popularity,NbPlays,Themes,GameUrl,OpeningTags
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Puzzle = require('../models/Puzzle');
const { Chess } = require('chess.js');

const BATCH_SIZE = 1000;
const REPORT_INTERVAL = 10000;

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { file: null, limit: Infinity };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) parsed.file = args[i + 1];
    if (args[i] === '--limit' && args[i + 1]) parsed.limit = parseInt(args[i + 1]) || Infinity;
  }
  return parsed;
}

function parseThemes(str) {
  if (!str || str.trim() === '') return [];
  return str.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

function parseMoves(str) {
  if (!str || str.trim() === '') return [];
  return str.trim().split(/\s+/).filter(Boolean);
}

function uciToSan(uci, fen) {
  if (!uci || uci.length < 4) return uci;
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    const move = chess.move({ from, to, promotion });
    if (move) return move.san;
  } catch {}
  return uci;
}

function convertUciMoves(uciMoves, startFen) {
  const result = [];
  try {
    const chess = new Chess(startFen);
    const isPlayerTurn = chess.turn() === (startFen.split(' ')[1]);
    for (let i = 0; i < uciMoves.length; i++) {
      const uci = uciMoves[i];
      if (uci.length < 4) continue;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;
      const move = chess.move({ from, to, promotion });
      if (move) {
        if (i % 2 === 0) {
          result.push(move.san);
        }
      }
    }
  } catch {
    return uciMoves;
  }
  if (result.length === 0) return uciMoves;
  return result;
}

function determinePlayerSide(fen) {
  const parts = fen.split(' ');
  return parts[1] === 'w' ? 'w' : 'b';
}

async function importPuzzles(filePath, maxCount) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.log('Download the Lichess puzzle dataset from:');
    console.log('  https://database.lichess.org/#puzzles');
    console.log('Then run:');
    console.log(`  node ${process.argv[1]} --file <path-to-csv> --limit 100000`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let header = true;
  let batch = [];
  let total = 0;
  let skipped = 0;
  let errors = 0;
  let startTime = Date.now();

  console.log(`Importing puzzles from: ${filePath}`);
  console.log(`Max puzzles: ${maxCount === Infinity ? 'unlimited' : maxCount}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log('');

  for await (const line of rl) {
    if (header) { header = false; continue; }
    if (total >= maxCount) break;

    const parts = line.split(',');
    if (parts.length < 7) { skipped++; continue; }

    try {
      const puzzleId = parts[0].trim();
      if (!puzzleId) { skipped++; continue; }

      const fen = parts[1].trim();
      const movesStr = parts[2].trim();
      const rating = parseInt(parts[3]) || 1500;
      const popularity = parseInt(parts[4]) || 0;
      const nbPlays = parseInt(parts[5]) || 0;
      const themes = parseThemes(parts[6]);
      const gameUrl = parts[7]?.trim() || '';
      const openingTags = parseThemes(parts[8]);

      const rawMoves = parseMoves(movesStr);
      if (rawMoves.length === 0) { skipped++; continue; }

      const solution = convertUciMoves(rawMoves, fen);

      batch.push({
        puzzleId,
        fen,
        solution,
        rating: Math.max(200, Math.min(3500, rating)),
        popularity,
        nbPlays,
        themes,
        openingTags,
        openingFamily: openingTags[0] || null,
        source: 'lichess',
        initialPly: 0,
        playerSide: determinePlayerSide(fen),
        gameUrl,
        isActive: true,
        solvedCount: 0,
        avgSolveTime: 0
      });

      total++;

      if (batch.length >= BATCH_SIZE) {
        await flushBatch(batch);
        batch = [];
        reportProgress(total, skipped, errors, startTime);
      }
    } catch (err) {
      errors++;
    }
  }

  if (batch.length > 0) {
    await flushBatch(batch);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log('='.repeat(50));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(50));
  console.log(`  Imported:    ${total}`);
  console.log(`  Skipped:     ${skipped}`);
  console.log(`  Errors:      ${errors}`);
  console.log(`  Time:        ${elapsed}s`);
}

async function flushBatch(batch) {
  try {
    const ops = batch.map(puzzle => ({
      updateOne: {
        filter: { puzzleId: puzzle.puzzleId },
        update: { $setOnInsert: puzzle },
        upsert: true
      }
    }));
    await Puzzle.bulkWrite(ops, { ordered: false });
  } catch (err) {
    console.error(`Batch insert error: ${err.message}`);
  }
}

function reportProgress(total, skipped, errors, startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = total > 0 ? (total / elapsed).toFixed(0) : 0;
  process.stdout.write(`\r  Imported: ${total.toLocaleString()} | Skipped: ${skipped} | Errors: ${errors} | Rate: ${rate}/s     `);
}

async function main() {
  const args = parseArgs();

  if (!args.file) {
    console.log('');
    console.log('LICHESS PUZZLE IMPORTER');
    console.log('='.repeat(50));
    console.log('');
    console.log('This script imports the official Lichess puzzle dataset.');
    console.log('');
    console.log('Download the dataset first:');
    console.log('  https://database.lichess.org/#puzzles');
    console.log('  (look for "lichess_db_puzzle.csv.zst")');
    console.log('');
    console.log('After downloading, decompress:');
    console.log('  # On Linux/Mac:');
    console.log('  zstd -d lichess_db_puzzle.csv.zst');
    console.log('');
    console.log('  # On Windows (with 7-Zip):');
    console.log('  7z x lichess_db_puzzle.csv.zst');
    console.log('');
    console.log('Then run:');
    console.log(`  node ${process.argv[1]} --file ./lichess_db_puzzle.csv --limit 100000`);
    console.log('');
    console.log('Options:');
    console.log('  --file <path>    Path to the CSV file (required)');
    console.log('  --limit <n>      Max puzzles to import (default: unlimited)');
    console.log('');
    process.exit(0);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    await importPuzzles(args.file, args.limit);
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
