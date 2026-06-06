/**
 * Enhanced Wallet Controller
 */

const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const { ValidationError, NotFoundError, asyncHandler } = require('../utils/errors');
const { formatResponse } = require('../utils/helpers');

/**
 * Get wallet details
 */
exports.getWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user.id });

  if (!wallet) {
    // Create wallet if not exists
    const newWallet = await Wallet.create({
      userId: req.user.id,
      balance: 0,
      currency: 'INR'
    });
    return res.json(formatResponse(true, 'Wallet retrieved', newWallet));
  }

  res.json(formatResponse(true, 'Wallet retrieved', wallet));
});

/**
 * Add funds to wallet
 */
exports.addFunds = asyncHandler(async (req, res) => {
  const { amount, paymentMethod } = req.body;

  if (!amount || amount <= 0) {
    throw new ValidationError('Invalid amount');
  }

  let wallet = await Wallet.findOne({ userId: req.user.id });

  if (!wallet) {
    wallet = await Wallet.create({
      userId: req.user.id,
      balance: 0,
      currency: 'INR'
    });
  }

  wallet.balance += amount;
  await wallet.save();

  // Log transaction
  await Transaction.create({
    walletId: wallet._id,
    type: 'credit',
    amount,
    description: `Added funds via ${paymentMethod}`,
    status: 'completed'
  });

  res.json(formatResponse(true, 'Funds added successfully', {
    newBalance: wallet.balance,
    amountAdded: amount
  }));
});

/**
 * Get transaction history
 */
exports.getTransactionHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  const skip = (page - 1) * limit;

  const wallet = await Wallet.findOne({ userId: req.user.id });

  if (!wallet) {
    throw new NotFoundError('Wallet');
  }

  const filter = { walletId: wallet._id };
  if (type && ['credit', 'debit'].includes(type)) {
    filter.type = type;
  }

  const transactions = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Transaction.countDocuments(filter);

  res.json(formatResponse(true, 'Transaction history retrieved', transactions, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  }));
});

/**
 * Request withdrawal
 */
exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, bankDetails, upiId } = req.body;

  if (!amount || amount <= 0) {
    throw new ValidationError('Invalid withdrawal amount');
  }

  const wallet = await Wallet.findOne({ userId: req.user.id });

  if (!wallet) {
    throw new NotFoundError('Wallet');
  }

  if (wallet.balance < amount) {
    throw new ValidationError('Insufficient balance');
  }

  // Check if user has pending withdrawal
  const pendingWithdrawal = await Withdrawal.findOne({
    userId: req.user.id,
    status: 'pending'
  });

  if (pendingWithdrawal) {
    throw new ValidationError('You already have a pending withdrawal request');
  }

  // Create withdrawal request
  const withdrawal = await Withdrawal.create({
    userId: req.user.id,
    walletId: wallet._id,
    amount,
    bankDetails,
    upiId,
    status: 'pending',
    requestedAt: new Date()
  });

  // Mark balance as pending
  wallet.pendingWithdrawal = (wallet.pendingWithdrawal || 0) + amount;
  await wallet.save();

  // Log transaction
  await Transaction.create({
    walletId: wallet._id,
    type: 'debit',
    amount,
    description: 'Withdrawal request initiated',
    status: 'pending',
    withdrawalId: withdrawal._id
  });

  res.json(formatResponse(true, 'Withdrawal request created', withdrawal));
});

/**
 * Get withdrawal history
 */
exports.getWithdrawalHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const filter = { userId: req.user.id };
  if (status) filter.status = status;

  const withdrawals = await Withdrawal.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Withdrawal.countDocuments(filter);

  res.json(formatResponse(true, 'Withdrawal history retrieved', withdrawals, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  }));
});

/**
 * Cancel withdrawal request
 */
exports.cancelWithdrawal = asyncHandler(async (req, res) => {
  const { withdrawalId } = req.params;

  const withdrawal = await Withdrawal.findById(withdrawalId);

  if (!withdrawal) {
    throw new NotFoundError('Withdrawal request');
  }

  if (withdrawal.userId.toString() !== req.user.id) {
    throw new ValidationError('Not authorized to cancel this withdrawal');
  }

  if (withdrawal.status !== 'pending') {
    throw new ValidationError('Only pending withdrawals can be cancelled');
  }

  const wallet = await Wallet.findById(withdrawal.walletId);
  wallet.pendingWithdrawal -= withdrawal.amount;
  await wallet.save();

  withdrawal.status = 'cancelled';
  withdrawal.cancelledAt = new Date();
  await withdrawal.save();

  // Log transaction
  await Transaction.create({
    walletId: wallet._id,
    type: 'credit',
    amount: withdrawal.amount,
    description: 'Withdrawal request cancelled',
    status: 'completed'
  });

  res.json(formatResponse(true, 'Withdrawal request cancelled', withdrawal));
});

/**
 * Get wallet summary (for coaches)
 */
exports.getWalletSummary = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user.id });

  if (!wallet) {
    throw new NotFoundError('Wallet');
  }

  const totalEarnings = await Transaction.aggregate([
    { $match: { walletId: wallet._id, type: 'credit' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalWithdrawals = await Transaction.aggregate([
    { $match: { walletId: wallet._id, type: 'debit' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  res.json(formatResponse(true, 'Wallet summary retrieved', {
    currentBalance: wallet.balance,
    totalEarnings: totalEarnings[0]?.total || 0,
    totalWithdrawals: totalWithdrawals[0]?.total || 0,
    pendingWithdrawal: wallet.pendingWithdrawal || 0,
    availableBalance: wallet.balance - (wallet.pendingWithdrawal || 0)
  }));
});

module.exports = exports;
