const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const nc = require('../controllers/notificationController');

router.get('/', protect, nc.getUserNotifications);
router.put('/:id/read', protect, nc.markRead);
router.put('/read-all', protect, nc.markAllRead);
router.get('/unread-count', protect, nc.getUnreadCount);

module.exports = router;
