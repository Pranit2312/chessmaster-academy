const mongoose = require('mongoose');
const { Chess } = require('chess.js');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/chess-coaching');
  const userId = '6a27e7f65a3f3bb3d845b01d';
  let last = null;
  function R() {
    return {
      json: d => { last = d; },
      status: c => ({ json: d => { last = { status: c, ...d }; } })
    };
  }
  function q(o = {}) {
    return { user: { _id: userId, id: userId }, query: {}, params: {}, body: {}, ...o };
  }
  const pc = require('../controllers/puzzleController');

  let pass = 0, fail = 0;

  function check(name, condition, detail) {
    if (condition) { pass++; console.log('  PASS:', name); }
    else { fail++; console.log('  FAIL:', name, '-', detail || ''); }
  }

  console.log('=== FINAL VERIFICATION ===\n');

  console.log('1. getDaily...');
  await pc.getDaily(q(), R());
  const dp = last?.puzzle;
  check('daily puzzle exists', !!dp, JSON.stringify(last).slice(0, 60));
  check('daily has puzzleId string', typeof dp?.puzzleId === 'string', typeof dp?.puzzleId);
  check('daily has solution array', Array.isArray(dp?.solution) && dp.solution.length > 0, JSON.stringify(dp?.solution));
  check('daily solution is SAN', dp?.solution?.length > 0 ? /^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8]/.test(dp.solution[0]) : false, dp?.solution?.[0]);

  console.log('2. check solution (daily)...');
  if (dp?.solution?.length > 0) {
    await pc.check(q({ body: { puzzleId: dp.puzzleId, move: dp.solution[0] } }), R());
    check('daily correct move accepted', last?.correct === true, JSON.stringify(last));
  }

  console.log('3. getByTheme...');
  await pc.getByTheme(q({ params: { theme: 'endgame' } }), R());
  const bp = last?.puzzles?.[0];
  check('theme returns puzzles', (last?.puzzles?.length || 0) > 0, 'count=' + last?.puzzles?.length);
  check('browse puzzle has puzzleId', typeof bp?.puzzleId === 'string', typeof bp?.puzzleId);

  console.log('4. check solution (browse)...');
  if (bp?.solution?.length > 0) {
    await pc.check(q({ body: { puzzleId: bp.puzzleId, move: bp.solution[0] } }), R());
    check('browse correct move accepted', last?.correct === true, JSON.stringify(last).slice(0, 80));

    const c = new Chess(bp.fen);
    const wrong = c.moves().find(m => m !== bp.solution[0]);
    if (wrong) {
      await pc.check(q({ body: { puzzleId: bp.puzzleId, move: wrong } }), R());
      check('wrong move rejected', last?.correct === false, JSON.stringify(last).slice(0, 80));
    }
  }

  console.log('5. getHint...');
  if (bp) {
    await pc.getHint(q({ params: { puzzleId: bp.puzzleId } }), R());
    check('hint returned', !!last?.hint?.move, JSON.stringify(last).slice(0, 60));
  }

  console.log('6. getProfile...');
  await pc.getProfile(q(), R());
  check('profile has rating', typeof last?.profile?.puzzleRating === 'number', last?.profile?.puzzleRating);

  console.log('7. getStats...');
  await pc.getStats(q(), R());
  check('stats show global total > 0', (last?.global?.total || 0) > 0, 'total=' + last?.global?.total);

  console.log('8. getRandom...');
  await pc.getRandom(q(), R());
  check('random puzzle from DB', last?.puzzle?.source === 'lichess', 'source=' + last?.puzzle?.source);

  console.log('9. getByRating...');
  await pc.getByRating(q({ params: { range: '1000-1500' } }), R());
  check('rating filter works', (last?.puzzles?.length || 0) > 0, 'count=' + last?.puzzles?.length);

  console.log('10. getRecommended...');
  await pc.getRecommended(q(), R());
  check('recommended returns puzzles', (last?.puzzles?.length || 0) > 0, 'count=' + last?.puzzles?.length);

  console.log('11. markDailySolved...');
  await pc.markDailySolved(q(), R());
  check('daily solved marked', last?.success === true, JSON.stringify(last));

  console.log('');
  console.log(`=== RESULTS: ${pass} passed, ${fail} failed ===`);

  await mongoose.disconnect();
  process.exit(fail > 0 ? 1 : 0);
}
main().catch(e => { console.error('FATAL:', e); process.exit(1); });
