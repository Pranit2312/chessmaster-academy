const https = require('https');
const mongoose = require('mongoose');
const path = require('path');
const { Chess } = require('chess.js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Puzzle = require('../models/Puzzle');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await Puzzle.countDocuments({});
  console.log('Existing puzzles:', existing);
  if (existing > 100) { console.log('Already enough'); process.exit(0); }

  const data = await new Promise((resolve, reject) => {
    https.get('https://database.lichess.org/lichess_db_puzzle.csv', {
      timeout: 30000,
      headers: { Range: 'bytes=0-500000' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });

  const lines = data.split('\n').slice(1).filter(Boolean);
  let total = 0, batch = [];

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 8) continue;
    const pid = parts[0].trim();
    if (!pid) continue;
    try {
      const fen = parts[1].trim();
      const moves = parts[2].trim().split(/\s+/).filter(Boolean);
      if (moves.length === 0) continue;
      const chess = new Chess(fen);
      const solution = moves.map(m => {
        try { return chess.move({ from: m.slice(0,2), to: m.slice(2,4), promotion: m[4] }).san; }
        catch { return m; }
      });
      const themes = (parts[7] || '').trim().split(/\s+/).filter(Boolean).map(t => t.toLowerCase());
      batch.push({
        puzzleId: pid, fen, solution,
        rating: Math.max(200, Math.min(3500, parseInt(parts[3]) || 1500)),
        popularity: parseInt(parts[5]) || 0,
        nbPlays: parseInt(parts[6]) || 0,
        themes,
        openingTags: (parts[9] || '').trim().split(/\s+/).filter(Boolean).map(t => t.toLowerCase()),
        source: 'lichess',
        playerSide: fen.split(' ')[1] === 'w' ? 'w' : 'b',
        isActive: true, solvedCount: 0, avgSolveTime: 0
      });
      total++;
    } catch {}
  }

  if (batch.length > 0) {
    const ops = batch.map(p => ({
      updateOne: {
        filter: { puzzleId: p.puzzleId },
        update: { $setOnInsert: p },
        upsert: true
      }
    }));
    await Puzzle.bulkWrite(ops, { ordered: false });
  }
  console.log('Imported:', total);
  console.log('Total in DB:', await Puzzle.countDocuments({}));
  await mongoose.disconnect();
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
