const express = require('express');
const router = express.Router();
const {
  createSlot,
  getSlots,
  getMySlots,
  updateSlot,
  deleteSlot,
  createDailySlots,
  createBulkDailySlots,
  createCustomSlot,
  getDailySlotsForDate,
  deleteDailySlots,
  getPredefinedSlots
} = require('../controllers/slotController');
const { protect, restrictTo } = require('../middleware/auth');

// ========================
// Daily Class Creation Routes (Manual)
// ========================

/**
 * GET /slots/predefined/list
 * Get list of predefined time slots
 */
router.get('/predefined/list', getPredefinedSlots);

/**
 * GET /slots/daily/:date
 * Get all slots for coach on a specific date
 */
router.get('/daily/:date', protect, restrictTo('coach'), getDailySlotsForDate);

/**
 * POST /slots/daily/create
 * Coach manually creates daily slots for a specific date
 */
router.post('/daily/create', protect, restrictTo('coach'), createDailySlots);

/**
 * POST /slots/daily/bulk
 * Coach creates slots for multiple days in bulk
 */
router.post('/daily/bulk', protect, restrictTo('coach'), createBulkDailySlots);

/**
 * POST /slots/daily/custom
 * Coach creates a custom slot with specific time
 */
router.post('/daily/custom', protect, restrictTo('coach'), createCustomSlot);

/**
 * DELETE /slots/daily/:date
 * Coach deletes all slots for a specific date
 */
router.delete('/daily/:date', protect, restrictTo('coach'), deleteDailySlots);

// ========================
// Standard Slot Routes
// ========================

router.post('/', protect, restrictTo('coach'), createSlot);
router.get('/', getSlots);
router.get('/my-slots', protect, restrictTo('coach'), getMySlots);
router.put('/:id', protect, restrictTo('coach'), updateSlot);
router.delete('/:id', protect, restrictTo('coach'), deleteSlot);

module.exports = router;
