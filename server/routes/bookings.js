const express = require('express');
const router = express.Router();
const { createBooking } = require('../controllers/bookingController');

const {
  getMyBookings,
  getCoachBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  addNotes
} = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/my-bookings', protect, restrictTo('student'), getMyBookings);
router.get('/coach-bookings', protect, restrictTo('coach'), getCoachBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/notes', protect, addNotes);
router.post('/', protect, restrictTo('student'), createBooking);

module.exports = router;