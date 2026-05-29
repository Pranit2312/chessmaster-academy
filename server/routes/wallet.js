const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');

const {
  getMyWallet,
  addMoney,
  getCoachEarnings,
  requestWithdrawal
} = require('../controllers/walletController');

router.get('/me', protect, getMyWallet);

router.post('/add-money', protect, addMoney);

router.get('/earnings',protect,restrictTo('coach'),getCoachEarnings);

router.post('/withdraw',protect,restrictTo('coach'),requestWithdrawal);

module.exports = router;