const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const tc = require('../controllers/tournamentController');

router.post('/', protect, restrictTo('admin'), tc.create);
router.get('/', tc.getAll);
router.get('/active', tc.getActive);
router.get('/stats', tc.getStats);
router.get('/my', protect, tc.getMy);
router.get('/:id', tc.getById);
router.put('/:id', protect, restrictTo('admin'), tc.update);
router.delete('/:id', protect, restrictTo('admin'), tc.remove);
router.post('/:id/register', protect, tc.register);
router.post('/:id/unregister', protect, tc.unregister);
router.post('/:id/start', protect, restrictTo('admin'), tc.startTournament);
router.post('/:id/next-round', protect, restrictTo('admin'), tc.nextRound);
router.post('/:id/end', protect, restrictTo('admin'), tc.endTournament);
router.post('/:id/submit-result', protect, tc.submitResult);
router.post('/:id/arena-pair', protect, tc.arenaPair);
router.get('/:id/standings', tc.getStandings);
router.get('/:id/pairings', tc.getPairings);

module.exports = router;
