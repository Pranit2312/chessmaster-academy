const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentDetails
} = require('../controllers/paymentController');

const { protect, restrictTo } = require('../middleware/auth');

console.log("protect:", typeof protect);
console.log("getPaymentDetails:", typeof getPaymentDetails);

router.post('/create-order', protect, restrictTo('student'), createOrder);
router.post('/verify', protect, restrictTo('student'), verifyPayment);
router.get('/:bookingId', protect, getPaymentDetails);

module.exports = router;