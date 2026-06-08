const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return null;
};

// Get my wallet
exports.getMyWallet = async (req, res) => {
  let wallet = await Wallet.findOne({ user: req.user.id });

  // 🔥 AUTO-CREATE WALLET IF NOT EXISTS
  if (!wallet) {
    wallet = await Wallet.create({
      user: req.user.id,
      balance: 0
    });
  }

  res.status(200).json({
    success: true,
    wallet
  });
};

// Alias for getMyWallet
exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(200).json({ success: true, data: { balance: 0 } });
    }
    res.status(200).json({ success: true, data: wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
    const { amount, bankDetails, upiId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const pending = await Withdrawal.findOne({ coach: req.user.id, status: 'pending' });
    if (pending) {
      return res.status(400).json({ success: false, message: 'You already have a pending withdrawal request' });
    }

    const withdrawal = await Withdrawal.create({
      coach: req.user.id,
      amount,
      bankDetails,
      upiId,
      status: 'pending'
    });

    wallet.balance -= amount;
    wallet.pendingWithdrawal = (wallet.pendingWithdrawal || 0) + amount;
    await wallet.save();

    await Transaction.create({
      user: req.user.id,
      amount,
      type: 'debit',
      reason: 'withdrawal'
    });

    res.status(200).json({
      success: true,
      withdrawal,
      newBalance: wallet.balance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add money via Razorpay (creates order, doesn't credit until verified)
exports.addMoney = async (req, res) => {
  try {
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({ success: false, message: 'Payment service unavailable' });
    }

    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `wallet_topup_${Date.now()}`
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Wallet Topup Order Error:', error);
    res.status(500).json({ success: false, message: 'Error creating topup order' });
  }
};

// Alias for addMoney (same Razorpay flow)
exports.addFunds = async (req, res) => {
  try {
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({ success: false, message: 'Payment service unavailable' });
    }

    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `add_funds_${Date.now()}`
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Add Funds Order Error:', error);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
};

// ============================================
// REAL RAZORPAY TOPUP INTEGRATION
// ============================================

exports.createTopupOrder = async (req, res) => {
  try {
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({ success: false, message: 'Payment service unavailable' });
    }

    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // INR paise
      currency: 'INR',
      receipt: `wallet_topup_${Date.now()}`
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Wallet Topup Order Error:', error);
    res.status(500).json({ success: false, message: 'Error creating topup order' });
  }
};

exports.verifyTopupPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Idempotency check: prevent double-crediting
    const existing = await Transaction.findOne({
      user: req.user.id,
      razorpayPaymentId: razorpay_payment_id
    });
    if (existing) {
      const wallet = await Wallet.findOne({ user: req.user.id });
      return res.status(200).json({ success: true, balance: wallet?.balance || 0, alreadyProcessed: true });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Top up the wallet after verification
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user.id, balance: Number(amount) });
    } else {
      wallet.balance += Number(amount);
      await wallet.save();
    }

    // Log the transaction with Razorpay IDs for idempotency
    await Transaction.create({
      user: req.user.id,
      amount: Number(amount),
      type: 'credit',
      reason: 'wallet_topup',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id
    });

    res.status(200).json({ success: true, balance: wallet.balance });
  } catch (error) {
    console.error('Wallet Topup Verify Error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};