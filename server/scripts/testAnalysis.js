const { analyzeGame } = require('../services/stockfishService');

const pgn = `[White "A"][Black "B"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O 1-0`;

analyzeGame(pgn)
  .then((r) => {
    console.log('OK moves:', r.moves.length, 'accuracy:', r.summary.whiteAccuracy);
    process.exit(0);
  })
  .catch((e) => {
    console.error('FAIL', e.message);
    process.exit(1);
  });
