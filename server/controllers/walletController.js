const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Write-through balance cache: hydrated from Transaction records on startup
// Source of truth is verified Transaction records, NOT the Wallet doc
const balanceCache = new Map();
let cacheReady = false;

async function hydrateBalanceCache() {
  balanceCache.clear();
  const transactions = await Transaction.find({}).sort({ createdAt: 1 });
  for (const tx of transactions) {
    const uid = String(tx.user);
    const current = balanceCache.get(uid) || 0;
    if (tx.type === 'credit') {
      balanceCache.set(uid, current + tx.amount);
    } else if (tx.type === 'debit') {
      balanceCache.set(uid, current - tx.amount);
    }
  }
  cacheReady = true;
  logger.info(`Balance cache hydrated: ${balanceCache.size} users`);
}

function getBalance(userId) {
  return balanceCache.get(String(userId)) || 0;
}

function updateBalance(userId, delta) {
  const uid = String(userId);
  const current = getBalance(uid);
  balanceCache.set(uid, Math.max(0, current + delta));
  return getBalance(uid);
}

const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return null;
};

exports.getMyWallet = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const balance = getBalance(userId);

    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user.id, balance: 0 });
    }

    res.json({
      success: true,
      wallet: {
        _id: wallet._id,
        user: wallet.user,
        balance,
        pendingWithdrawal: wallet.pendingWithdrawal || 0,
        currency: wallet.currency || 'INR',
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt
      }
    });
  } catch (error) {
    logger.error('getMyWallet error', error.message);
    res.json({ success: true, wallet: { balance: 0, pendingWithdrawal: 0, currency: 'INR' } });
  }
};

exports.getWallet = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const balance = getBalance(userId);

    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = { balance: 0, pendingWithdrawal: 0, currency: 'INR' };
    }

    wallet.balance = balance;
    res.json({ success: true, data: wallet });
  } catch (error) {
    logger.error('getWallet error', error.message);
    res.json({ success: true, data: { balance: 0, pendingWithdrawal: 0, currency: 'INR' } });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    logger.error('getTransactions error', error.message);
    res.json({ success: true, data: [] });
  }
};

exports.getCoachEarnings = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
      reason: 'coach_earning'
    }).sort({ createdAt: -1 });

    const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({ success: true, totalEarnings, transactions });
  } catch (error) {
    logger.error('getCoachEarnings error', error.message);
    res.json({ success: true, totalEarnings: 0, transactions: [] });
  }
};

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankDetails, upiId } = req.body;
    const userId = String(req.user.id);
    const balance = getBalance(userId);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    if (balance < amount) {
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

    updateBalance(userId, -amount);

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (wallet) {
      wallet.pendingWithdrawal = (wallet.pendingWithdrawal || 0) + amount;
      await wallet.save();
    }

    await Transaction.create({
      user: req.user.id,
      amount,
      type: 'debit',
      reason: 'withdrawal'
    });

    res.json({ success: true, withdrawal, newBalance: getBalance(userId) });
  } catch (error) {
    logger.error('requestWithdrawal error', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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
    logger.error('Wallet Topup Order Error', error.message);
    res.status(500).json({ success: false, message: 'Error creating topup order' });
  }
};

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
    logger.error('Add Funds Order Error', error.message);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
};

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
    logger.error('Wallet Topup Order Error', error.message);
    res.status(500).json({ success: false, message: 'Error creating topup order' });
  }
};

exports.verifyTopupPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const userId = String(req.user.id);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    const existing = await Transaction.findOne({
      user: req.user.id,
      razorpayPaymentId: razorpay_payment_id
    });
    if (existing) {
      return res.json({ success: true, balance: getBalance(userId), alreadyProcessed: true });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    updateBalance(userId, Number(amount));

    await Transaction.create({
      user: req.user.id,
      amount: Number(amount),
      type: 'credit',
      reason: 'wallet_topup',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id
    });

    res.json({ success: true, balance: getBalance(userId) });
  } catch (error) {
    logger.error('Wallet Topup Verify Error', error.message);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

exports.resetWallet = async (req, res) => {
  try {
    balanceCache.set(String(req.user.id), 0);

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (wallet) {
      wallet.balance = 0;
      wallet.pendingWithdrawal = 0;
      await wallet.save();
    }
    await Transaction.deleteMany({ user: req.user.id });
    await Withdrawal.deleteMany({ coach: req.user.id });

    res.json({ success: true, message: 'Wallet reset to zero' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export cache hydrator for use in server startup
exports.hydrateBalanceCache = hydrateBalanceCache;
