const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ac = require('../controllers/achievementController');

router.get('/', ac.getAll);
router.get('/mine', protect, ac.getMine);

module.exports = router;
