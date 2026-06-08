/**
 * Use the CJS build to avoid CRA source-map-loader warnings from chess.js ESM bundle.
 */
export { Chess } from 'chess.js/dist/cjs/chess.js';
