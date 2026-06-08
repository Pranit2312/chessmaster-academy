/**
 * Suppress harmless source-map warnings from chess.js (missing chess.ts in published package).
 */
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
        /chess\.ts/
      ];

      return webpackConfig;
    }
  }
};
