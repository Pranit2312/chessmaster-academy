const { analyzeGame } = require('../services/stockfishService');

const SAMPLE = `[Event "Test"]
[White "Student"]
[Black "Opponent"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O
9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 h6
16. Bd2 c5 17. d5 c4 18. Nh2 Nc5 19. Ng4 Nxg4 20. hxg4 1-0`;

console.log('Analyzing sample game with Stockfish...');
const t = Date.now();

analyzeGame(SAMPLE, { depth: 8 })
  .then((r) => {
    console.log('Done in', Math.round((Date.now() - t) / 1000), 's');
    console.log('Move 1 eval after:', r.moves[0].evaluationAfter);
    console.log('Move 5 eval after:', r.moves[4]?.evaluationAfter);
    console.log('White accuracy:', r.summary.whiteAccuracy);
    console.log('Black accuracy:', r.summary.blackAccuracy);
    console.log('Blunders:', r.summary.blunders);
    console.log('First 6 losses:', r.moves.slice(0, 6).map((m) => m.lossOfEval));
    console.log('Max loss:', Math.max(...r.moves.map((m) => m.lossOfEval || 0)));
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
