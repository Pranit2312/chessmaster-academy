const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  verifySignature
} = require('../controllers/paymentController');

const { protect, restrictTo } = require('../middleware/auth');

router.post('/create-order', protect, restrictTo('student'), createOrder);
router.post('/verify', protect, restrictTo('student'), verifyPayment);
router.post('/verify-signature', protect, restrictTo('student'), verifySignature);
router.get('/:bookingId', protect, getPaymentDetails);

module.exports = router;