const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');

// Get my wallet
exports.getMyWallet = async (req, res) => {
  let wallet = await Wallet.findOne({ user: req.user.id });

  // 🔥 AUTO-CREATE WALLET IF NOT EXISTS
  if (!wallet) {
    wallet = await Wallet.create({
      user: req.user.id,
      balance: 0,
      earnings: 0
    });
  }

  res.status(200).json({
    success: true,
    wallet
  });
};

exports.getCoachEarnings = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
      reason: 'coach_earning'
    }).sort({ createdAt: -1 });

    const totalEarnings = transactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    res.status(200).json({
      success: true,
      totalEarnings,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    wallet.balance -= amount;
    await wallet.save();

    const withdrawal = await Withdrawal.create({
      coach: req.user.id,
      amount
    });

    res.status(200).json({
      success: true,
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add money (student)
exports.addMoney = async (req, res) => {
  const { amount } = req.body;

  const wallet = await Wallet.findOne({ user: req.user.id });
  wallet.balance += amount;
  wallet.updatedAt = new Date();
  await wallet.save();

  await Transaction.create({
    user: req.user.id,
    amount,
    type: 'credit',
    reason: 'wallet_topup'
  });

  res.json({ success: true, balance: wallet.balance });
};