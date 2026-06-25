const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const tc = require('../controllers/tournamentController');

router.post('/', protect, tc.create);
router.get('/', tc.getAll);
router.get('/active', tc.getActive);
router.get('/stats', tc.getStats);
router.get('/profile-stats', protect, tc.getProfileStats);
router.get('/my', protect, tc.getMy);
router.get('/:id', tc.getById);
router.put('/:id', protect, tc.update);
router.delete('/:id', protect, tc.cancel);
router.post('/:id/register', protect, tc.register);
router.post('/:id/unregister', protect, tc.unregister);
router.delete('/:id/players/:playerId', protect, tc.removePlayer);
router.post('/:id/start', protect, tc.startTournament);
router.post('/:id/next-round', protect, tc.nextRound);
router.post('/:id/end', protect, tc.endTournament);
router.post('/:id/submit-result', protect, tc.submitResult);
router.post('/:id/arena-pair', protect, tc.arenaPair);
router.post('/join-by-invite', protect, tc.joinByInvite);
router.get('/:id/standings', tc.getStandings);
router.get('/:id/pairings', tc.getPairings);

module.exports = router;