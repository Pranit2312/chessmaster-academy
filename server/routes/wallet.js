const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');

const {
  getMyWallet,
  getWallet,
  addMoney,
  addFunds,
  getCoachEarnings,
  requestWithdrawal,
  getTransactions,
  createTopupOrder,
  verifyTopupPayment
} = require('../controllers/walletController');

router.get('/me', protect, getMyWallet);
router.get('/', protect, getWallet);
router.get('/transactions', protect, getTransactions);

router.post('/add-money', protect, addMoney);
router.post('/add-funds', protect, addFunds);

// Razorpay Topup
router.post('/create-topup-order', protect, createTopupOrder);
router.post('/verify-topup', protect, verifyTopupPayment);

router.get('/earnings',protect,restrictTo('coach'),getCoachEarnings);

router.post('/withdraw',protect,restrictTo('coach'),requestWithdrawal);
router.post('/request-withdrawal',protect,restrictTo('coach'),requestWithdrawal);

module.exports = router;