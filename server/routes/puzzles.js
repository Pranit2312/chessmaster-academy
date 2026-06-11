const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const puzzleController = require('../controllers/puzzleController');
const puzzleRushController = require('../controllers/puzzleRushController');
const coachPuzzleController = require('../controllers/coachPuzzleController');

// =====================
// PUZZLE ENDPOINTS
// =====================
router.get('/random', protect, puzzleController.getRandom);
router.get('/daily', protect, puzzleController.getDaily);
router.get('/theme/:theme', protect, puzzleController.getByTheme);
router.get('/rating/:range', protect, puzzleController.getByRating);
router.get('/recommended', protect, puzzleController.getRecommended);
router.post('/check', protect, puzzleController.check);
router.get('/stats', protect, puzzleController.getStats);
router.get('/profile', protect, puzzleController.getProfile);
router.post('/daily/solved', protect, puzzleController.markDailySolved);
router.get('/:puzzleId/hint', protect, puzzleController.getHint);

// =====================
// PUZZLE RUSH ENDPOINTS
// =====================
router.post('/rush/start', protect, puzzleRushController.startRush);
router.post('/rush/next', protect, puzzleRushController.nextPuzzle);
router.post('/rush/:sessionId/end', protect, puzzleRushController.endRush);
router.get('/rush/leaderboard', protect, puzzleRushController.getLeaderboard);
router.get('/rush/history', protect, puzzleRushController.getHistory);

// =====================
// COACH PUZZLE ENDPOINTS
// =====================
router.post('/coach/create', protect, restrictTo('coach'), coachPuzzleController.createPuzzle);
router.get('/coach/mine', protect, restrictTo('coach'), coachPuzzleController.getMyPuzzles);
router.get('/coach/browse', protect, coachPuzzleController.browsePuzzles);
router.get('/coach/:id', protect, coachPuzzleController.getPuzzle);
router.put('/coach/:id', protect, restrictTo('coach'), coachPuzzleController.updatePuzzle);
router.delete('/coach/:id', protect, restrictTo('coach'), coachPuzzleController.deletePuzzle);
router.post('/coach/:id/like', protect, coachPuzzleController.likePuzzle);
router.post('/coach/:id/save', protect, coachPuzzleController.savePuzzle);

module.exports = router;
