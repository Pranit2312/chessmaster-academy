/**
 * Puzzle Data Integrity Validator
 *
 * Scans the puzzle collection and verifies:
 * 1. FEN is valid
 * 2. Active color from FEN matches playerSide
 * 3. First solution move is legal from the FEN
 * 4. First move is made by the correct side
 * 5. All subsequent moves in solution are legal
 */

const mongoose = require('mongoose');
const { Chess } = require('chess.js');

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const SAMPLE_SIZE = parseInt(process.argv[2], 10) || 1000;

async function validatePuzzle(puzzle) {
  const result = {
    puzzleId: puzzle.puzzleId,
    _id: String(puzzle._id),
    fen: puzzle.fen,
    playerSide: puzzle.playerSide,
    solution: puzzle.solution,
    valid: true,
    errors: []
  };

  // 1. Validate FEN format
  const fenParts = puzzle.fen.trim().split(/\s+/);
  if (fenParts.length < 2) {
    result.valid = false;
    result.errors.push('Invalid FEN: too few fields');
    return result;
  }

  const activeColor = fenParts[1];
  if (activeColor !== 'w' && activeColor !== 'b') {
    result.valid = false;
    result.errors.push(`Invalid active color in FEN: "${activeColor}"`);
    return result;
  }

  // 2. Verify active color matches stored playerSide
  if (activeColor !== puzzle.playerSide) {
    result.valid = false;
    result.errors.push(`FEN active color "${activeColor}" != stored playerSide "${puzzle.playerSide}"`);
  }

  // 3. Try to create chess instance from FEN
  let chess;
  try {
    chess = new Chess(puzzle.fen);
  } catch (e) {
    result.valid = false;
    result.errors.push(`Cannot create chess position from FEN: ${e.message}`);
    return result;
  }

  // 4. Verify FEN active color matches chess.js turn()
  const chessTurn = chess.turn();
  if (chessTurn !== activeColor) {
    result.valid = false;
    result.errors.push(`chess.js turn()="${chessTurn}" != FEN active color="${activeColor}"`);
  }

  if (!puzzle.solution || puzzle.solution.length === 0) {
    result.valid = false;
    result.errors.push('Empty solution');
    return result;
  }

  // 5. Validate all solution moves sequentially
  const testGame = new Chess(puzzle.fen);
  for (let i = 0; i < puzzle.solution.length; i++) {
    const moveStr = puzzle.solution[i];
    const expectedTurn = i % 2 === 0 ? activeColor : (activeColor === 'w' ? 'b' : 'w');

    // Try to parse and play the move
    let moveResult;
    try {
      moveResult = testGame.move(moveStr, { sloppy: true });
    } catch {
      // Try as UCI (from+to)
      try {
        if (moveStr.length >= 4) {
          const from = moveStr.slice(0, 2);
          const to = moveStr.slice(2, 4);
          const prom = moveStr.length > 4 ? moveStr[4] : undefined;
          moveResult = testGame.move({ from, to, promotion: prom || 'q' });
        }
      } catch {}
    }

    if (!moveResult) {
      result.valid = false;
      const side = i % 2 === 0 ? 'first' : 'opponent';
      result.errors.push(`Move ${i+1} ("${moveStr}", ${side}): illegal from position`);
      break; // Stop checking after first failure
    }

    // Verify move is made by correct side
    if (moveResult.color !== expectedTurn) {
      result.valid = false;
      result.errors.push(
        `Move ${i+1} ("${moveStr}"): played by ${moveResult.color} but expected ${expectedTurn}`
      );
    }
  }

  return result;
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const Puzzle = mongoose.model('Puzzle', require('mongoose').Schema({}, { strict: false }), 'puzzles');
    const total = await Puzzle.countDocuments({ isActive: true });
    console.log(`Total active puzzles: ${total}`);
    console.log(`Validating sample of ${SAMPLE_SIZE} puzzles...\n`);

    // Sample random puzzles
    const sample = await Puzzle.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: SAMPLE_SIZE } }
    ]);

    console.log(`Sampled ${sample.length} puzzles\n`);

    let valid = 0;
    let invalid = 0;
    const failures = [];

    for (let i = 0; i < sample.length; i++) {
      const result = await validatePuzzle(sample[i]);
      if (result.valid) {
        valid++;
      } else {
        invalid++;
        if (failures.length < 10) {
          failures.push(result);
        }
      }

      if ((i + 1) % 200 === 0) {
        process.stdout.write(`  Checked ${i + 1}/${sample.length}... valid: ${valid}, invalid: ${invalid}\n`);
      }
    }

    console.log('\n========================================');
    console.log('RESULTS');
    console.log('========================================');
    console.log(`Total checked:   ${sample.length}`);
    console.log(`Valid:           ${valid}`);
    console.log(`Invalid:         ${invalid}`);
    console.log(`Pass rate:       ${((valid / sample.length) * 100).toFixed(2)}%`);

    if (failures.length > 0) {
      console.log('\n--- FAILURE EXAMPLES (up to 10) ---');
      for (const f of failures) {
        console.log(`\n[INVALID] PuzzleId: ${f.puzzleId}`);
        console.log(`  FEN:             ${f.fen}`);
        console.log(`  Active color:    ${f.fen.split(/\s+/)[1]}`);
        console.log(`  Stored playerSide: ${f.playerSide}`);
        console.log(`  Solution:        ${f.solution.join(' ')}`);
        for (const err of f.errors) {
          console.log(`  ERROR: ${err}`);
        }
      }
    }

    await mongoose.disconnect();
    console.log('\nDone.');
    process.exit(invalid > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal:', err);
    process.exit(1);
  }
}

main();
