const express = require('express');
const router = express.Router();
const {
  getCoaches,
  getCoachById,
  updateProfile,
  getUserProfile
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/coaches', getCoaches);
router.get('/coach/:id', getCoachById);
router.get('/profile/:id', getUserProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;