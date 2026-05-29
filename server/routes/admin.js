const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');

router.get(
  '/transactions',
  protect,
  restrictTo('admin'),
  async (req, res) => {
    const transactions = await Transaction.find()
      .populate('user', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, transactions });
  }
);

router.get(
  '/withdrawals',
  protect,
  restrictTo('admin'),
  async (req, res) => {
    const withdrawals = await Withdrawal.find()
      .populate('coach', 'name email')
      .sort({ requestedAt: -1 });

    res.json({ success: true, withdrawals });
  }
);

module.exports = router;