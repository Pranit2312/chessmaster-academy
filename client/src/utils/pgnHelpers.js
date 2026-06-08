import { Chess } from './chessEngine';

/**
 * Normalize common shorthand (e.g. "e4-e5" → "1. e4 e5").
 */
export function normalizePgnInput(raw) {
  let pgn = (raw || '').trim();
  if (!pgn) return pgn;

  // e4-e5 or e4-e5-Nf3 → spaces instead of hyphens between moves
  pgn = pgn.replace(
    /([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O(?:-O)?)\s*-\s*(?=[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8]|O-O)/gi,
    '$1 '
  );

  if (!/\d+\./.test(pgn) && /[a-h1-8NBRQKOx=+#\s]/i.test(pgn)) {
    pgn = `1. ${pgn}`;
  }

  return pgn;
}

export function validatePgn(raw) {
  const pgn = normalizePgnInput(raw);
  if (!pgn) {
    return { valid: false, message: 'PGN is required', normalized: '' };
  }

  try {
    const chess = new Chess();
    chess.loadPgn(pgn, { sloppy: true });
    if (chess.history().length === 0) {
      return {
        valid: false,
        message: 'No moves found. Use standard PGN like: 1. e4 e5 2. Nf3 Nc6',
        normalized: pgn
      };
    }
    return { valid: true, message: '', normalized: pgn };
  } catch (error) {
    return {
      valid: false,
      message: `Invalid PGN: ${error.message}. Try "Load sample game" or paste from Chess.com/Lichess.`,
      normalized: pgn
    };
  }
}

export const SAMPLE_PGN = `[Event "Casual Game"]
[Site "ChessMaster Academy"]
[Date "2024.01.15"]
[White "Student"]
[Black "Opponent"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O
9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 h6
16. Bd2 c5 17. d5 c4 18. Nh2 Nc5 19. Ng4 Nxg4 20. hxg4 1-0`;

export function formatEval(centipawns) {
  if (centipawns === null || centipawns === undefined) return '—';
  if (Math.abs(centipawns) >= 9000) {
    const mate = Math.max(1, Math.round((10000 - Math.abs(centipawns)) / 50));
    return centipawns > 0 ? `M${mate}` : `-M${mate}`;
  }
  const pawns = (centipawns / 100).toFixed(1);
  return centipawns > 0 ? `+${pawns}` : `${pawns}`;
}

export function getEvalBarPercent(centipawns) {
  const clamped = Math.max(-800, Math.min(800, centipawns || 0));
  return 50 + (clamped / 800) * 50;
}

export function mistakeBadgeClass(type) {
  switch (type) {
    case 'Blunder':
      return 'badge-blunder';
    case 'Mistake':
      return 'badge-mistake';
    case 'Inaccuracy':
      return 'badge-inaccuracy';
    default:
      return '';
  }
}
