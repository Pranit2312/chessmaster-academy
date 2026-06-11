const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const gc = require('../controllers/gameController');
const fc = require('../controllers/friendController');
const matchmaking = require('../services/matchmakingService');

// Friend routes must come BEFORE /:id to avoid "friends" matching as a game ID
router.post('/friends/request', protect, fc.sendRequest);
router.put('/friends/accept/:id', protect, fc.acceptRequest);
router.put('/friends/reject/:id', protect, fc.rejectRequest);
router.delete('/friends/:id', protect, fc.removeFriend);
router.post('/friends/block', protect, fc.blockUser);
router.get('/friends', protect, fc.getFriends);
router.get('/friends/pending', protect, fc.getPendingRequests);
router.get('/friends/search', protect, fc.searchUsers);

// Game routes
router.get('/time-controls', (req, res) => {
  const { category } = req.query;
  const all = {};
  ['bullet', 'blitz', 'rapid', 'classical'].forEach(cat => {
    all[cat] = matchmaking.getTimeControls(cat);
  });
  res.json({ success: true, timeControls: category ? all[category] : all });
});
router.get('/live', gc.getLiveGames);
router.get('/my', protect, gc.getMyGames);
router.get('/active', protect, gc.getActiveGame);
router.get('/rating', protect, gc.getRating);
router.get('/leaderboard', gc.getLeaderboard);
router.get('/opponent/:username', protect, gc.getOpponent);
router.get('/stats/:userId', gc.getUserStats);
router.get('/stats', protect, gc.getUserStats);
router.get('/:id', gc.getGame);
router.get('/:id/replay', gc.getGameReplay);
router.post('/:id/analyze', protect, gc.analyzeGame);
router.post('/:id/analyze-stockfish', protect, gc.analyzeGameStockfish);

module.exports = router;
