const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const fc = require('../controllers/forumController');

router.get('/discussions', fc.getDiscussions);
router.get('/discussions/:id', fc.getDiscussion);
router.post('/discussions', protect, fc.createDiscussion);
router.put('/discussions/:id', protect, fc.updateDiscussion);
router.delete('/discussions/:id', protect, fc.deleteDiscussion);
router.post('/discussions/:id/like', protect, fc.likeDiscussion);
router.put('/discussions/:id/pin', protect, restrictTo('admin'), fc.pinDiscussion);

router.get('/discussions/:id/replies', fc.getReplies);
router.post('/discussions/:id/replies', protect, fc.createReply);
router.put('/replies/:id', protect, fc.updateReply);
router.delete('/replies/:id', protect, fc.deleteReply);
router.post('/replies/:id/solution', protect, fc.markSolution);
router.post('/replies/:id/like', protect, fc.likeReply);

module.exports = router;
