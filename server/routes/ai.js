const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const aiBotController = require('../controllers/aiBotController');
const aiPuzzleController = require('../controllers/aiPuzzleController');
const aiOpeningController = require('../controllers/aiOpeningController');
const aiChatController = require('../controllers/aiChatController');
const aiInsightsController = require('../controllers/aiInsightsController');

const fs = require('fs');
const path = require('path');

// ======================
// ENGINE HEALTH CHECK
// ======================
router.get('/engine/status', protect, (req, res) => {
  const enginePath = path.join(__dirname, '..', 'engines', 'stockfish.exe');
  const hasNative = fs.existsSync(enginePath);
  let wasmAvailable = false;
  try { require.resolve('stockfish'); wasmAvailable = true; } catch {}

  res.json({
    success: true,
    engine: {
      native: { available: hasNative, path: hasNative ? enginePath : null },
      wasm: { available: wasmAvailable },
      status: hasNative ? 'native' : wasmAvailable ? 'wasm' : 'unavailable',
      threads: parseInt(process.env.STOCKFISH_THREADS || '2'),
      hash: parseInt(process.env.STOCKFISH_HASH || '256'),
      maxDepth: parseInt(process.env.STOCKFISH_MAX_DEPTH || '30')
    }
  });
});

// ======================
// ENGINE TEST
// ======================
router.post('/engine/test', protect, async (req, res) => {
  try {
    const { analyzeFen } = require('../services/stockfishEngine');
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const result = await analyzeFen(fen, 12);
    res.json({
      success: true,
      result: {
        bestMove: result.bestMoveUci,
        bestMoveSan: result.bestMoveSan,
        evaluation: result.evalCp,
        isMate: result.isMate,
        mateIn: result.mateIn,
        depth: result.depth,
        pv: result.pv.slice(0, 6)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Engine test failed', error: err.message });
  }
});

// ======================
// AI BOT PRACTICE
// ======================
router.post('/bot/start', protect, aiBotController.startBotGame);
router.post('/bot/:gameId/move', protect, aiBotController.makeMove);
router.get('/bot/:gameId', protect, aiBotController.getGame);
router.get('/bot/games', protect, aiBotController.getGames);
router.put('/bot/:gameId/resign', protect, aiBotController.resignGame);
router.post('/bot/:gameId/analyze', protect, aiBotController.analyzeBotGame);

// ======================
// AI PUZZLES
// ======================
router.get('/puzzles/daily', protect, aiPuzzleController.getDailyPuzzle);
router.get('/puzzles', protect, aiPuzzleController.getPuzzles);
router.get('/puzzles/stats', protect, aiPuzzleController.getPuzzleStats);
router.get('/puzzles/:id', protect, aiPuzzleController.getPuzzleById);
router.post('/puzzles/:id/solve', protect, aiPuzzleController.solvePuzzle);
router.post('/puzzles/generate', protect, aiPuzzleController.generatePuzzles);
router.post('/puzzles/sync-lichess', protect, aiPuzzleController.syncLichessPuzzles);

// ======================
// AI OPENING EXPLORER
// ======================
router.get('/openings/recommendations', protect, aiOpeningController.getRecommendations);
router.get('/openings/explore', protect, aiOpeningController.exploreOpening);
router.get('/openings/explore/:ecoCode', protect, aiOpeningController.exploreOpening);
router.get('/openings/:ecoCode/moves', protect, aiOpeningController.getOpeningMoves);
router.get('/openings/search', protect, aiOpeningController.searchOpenings);
router.get('/openings/user-stats', protect, aiOpeningController.getUserOpeningStats);
router.post('/openings/seed', protect, aiOpeningController.seedOpenings);

// ======================
// AI COACH CHAT
// ======================
router.post('/chat/send', protect, aiChatController.sendMessage);
router.get('/chat/history', protect, aiChatController.getChatHistory);
router.get('/chat/:id', protect, aiChatController.getChatById);
router.delete('/chat/:id', protect, aiChatController.clearChat);

// ======================
// AI INSIGHTS
// ======================
router.get('/insights/weaknesses', protect, aiInsightsController.getWeaknessAnalysis);
router.get('/insights/recommendations', protect, aiInsightsController.getRecommendations);
router.get('/insights/progress', protect, aiInsightsController.getProgressInsights);
router.get('/insights/assessment', protect, aiInsightsController.getSkillAssessment);
router.get('/insights/summary', protect, aiInsightsController.getDashboardSummary);
router.put('/insights/:id/dismiss', protect, aiInsightsController.dismissInsight);

module.exports = router;
