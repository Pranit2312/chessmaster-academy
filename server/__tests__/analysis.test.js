const { parsePgn, classifyMove, accuracyFromAvgLoss } = require('../services/pgnParserService');
const { analyzeGame } = require('../services/stockfishService');

const SAMPLE_PGN = `[Event "Test"]
[White "Alice"]
[Black "Bob"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 1-0`;

describe('PGN Parser Service', () => {
  it('should parse a valid PGN', () => {
    const parsed = parsePgn(SAMPLE_PGN);
    expect(parsed.whitePlayer).toBe('Alice');
    expect(parsed.blackPlayer).toBe('Bob');
    expect(parsed.moves.length).toBeGreaterThan(0);
  });

  it('should reject empty PGN', () => {
    expect(() => parsePgn('')).toThrow();
  });

  it('should classify blunders correctly', () => {
    const result = classifyMove(200, -150, true);
    expect(result.isMistake).toBe(true);
    expect(result.mistakeType).toBe('Blunder');
  });

  it('should compute accuracy from average loss', () => {
    const accuracy = accuracyFromAvgLoss(0);
    expect(accuracy).toBeGreaterThan(90);
  });
});

describe('Stockfish Analysis Service', () => {
  it('should analyze a full game', async () => {
    const result = await analyzeGame(SAMPLE_PGN);
    expect(result.moves.length).toBeGreaterThan(0);
    expect(result.summary.totalMoves).toBe(result.moves.length);
    expect(result.summary.whiteAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.summary.blackAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.opening.name).toBeDefined();
  });
});
