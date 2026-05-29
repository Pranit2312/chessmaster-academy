const express = require('express');
const router = express.Router();
const {
  createSlot,
  getSlots,
  getMySlots,
  updateSlot,
  deleteSlot
} = require('../controllers/slotController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('coach'), createSlot);
router.get('/', getSlots);
router.get('/my-slots', protect, restrictTo('coach'), getMySlots);
router.put('/:id', protect, restrictTo('coach'), updateSlot);
router.delete('/:id', protect, restrictTo('coach'), deleteSlot);

module.exports = router;