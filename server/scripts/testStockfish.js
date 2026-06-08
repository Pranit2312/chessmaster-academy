const engine = require('../services/stockfishEngine');

engine
  .analyzeFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 8)
  .then((r) => {
    console.log('Stockfish result:', r);
    engine.quit();
    process.exit(0);
  })
  .catch((e) => {
    console.error('FAIL', e);
    process.exit(1);
  });
