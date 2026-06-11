const User = require('../models/User');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../utils/errors');

exports.getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
};

exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
};

exports.banUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false, bannedAt: new Date() }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User banned', user });
};

exports.suspendUser = async (req, res) => {
  const days = req.body.days || 7;
  const suspendedUntil = new Date(Date.now() + days * 86400000);
  const user = await User.findByIdAndUpdate(req.params.id, { suspendedUntil }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: `User suspended for ${days} days`, user });
};

exports.deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User deleted' });
};

exports.restoreUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: true, bannedAt: null, suspendedUntil: null }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User restored', user });
};

exports.getAllCoaches = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { role: 'coach' };
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  const [coaches, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ success: true, coaches, total, page, pages: Math.ceil(total / limit) });
};

exports.verifyCoach = async (req, res) => {
  const coach = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }).select('-password');
  if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
  res.json({ success: true, message: 'Coach verified', coach });
};

exports.rejectCoach = async (req, res) => {
  const coach = await User.findByIdAndUpdate(req.params.id, { isVerified: false }, { new: true }).select('-password');
  if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
  res.json({ success: true, message: 'Coach verification rejected', coach });
};

exports.featureCoach = async (req, res) => {
  const coach = await User.findByIdAndUpdate(req.params.id, { isFeatured: true }, { new: true }).select('-password');
  if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
  res.json({ success: true, message: 'Coach featured', coach });
};

exports.unfeatureCoach = async (req, res) => {
  const coach = await User.findByIdAndUpdate(req.params.id, { isFeatured: false }, { new: true }).select('-password');
  if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
  res.json({ success: true, message: 'Coach unfeatured', coach });
};

exports.getAllCourses = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: 'i' };
  }
  const [courses, total] = await Promise.all([
    Course.find(filter).populate('instructor', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Course.countDocuments(filter)
  ]);
  res.json({ success: true, courses, total, page, pages: Math.ceil(total / limit) });
};

exports.approveCourse = async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', approvedBy: req.user._id, publishedAt: new Date() },
    { new: true }
  ).populate('instructor', 'name email');
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, message: 'Course approved', course });
};

exports.rejectCourse = async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', rejectionReason: req.body.reason || '' },
    { new: true }
  ).populate('instructor', 'name email');
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, message: 'Course rejected', course });
};

exports.featureCourse = async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { isFeatured: true },
    { new: true }
  );
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, message: 'Course featured', course });
};

exports.deleteCourse = async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, { status: 'archived', isPublished: false }, { new: true });
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, message: 'Course archived' });
};

exports.getAllTransactions = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    Transaction.find().populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments()
  ]);
  res.json({ success: true, transactions, total, page, pages: Math.ceil(total / limit) });
};

exports.getPendingWithdrawals = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { status: 'pending' };
  const [withdrawals, total] = await Promise.all([
    Withdrawal.find(filter).populate('coach', 'name email').sort({ requestedAt: -1 }).skip(skip).limit(limit),
    Withdrawal.countDocuments(filter)
  ]);
  res.json({ success: true, withdrawals, total, page, pages: Math.ceil(total / limit) });
};

exports.getAllWithdrawals = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [withdrawals, total] = await Promise.all([
    Withdrawal.find(filter).populate('coach', 'name email').sort({ requestedAt: -1 }).skip(skip).limit(limit),
    Withdrawal.countDocuments(filter)
  ]);
  res.json({ success: true, withdrawals, total, page, pages: Math.ceil(total / limit) });
};

exports.approveWithdrawal = async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id).populate('coach');
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
  if (withdrawal.status !== 'pending') return res.status(400).json({ success: false, message: 'Withdrawal already processed' });
  withdrawal.status = 'approved';
  await withdrawal.save();
  const Wallet = require('../models/Wallet');
  const wallet = await Wallet.findOne({ user: withdrawal.coach._id });
  if (wallet) {
    wallet.pendingWithdrawal = Math.max(0, (wallet.pendingWithdrawal || 0) - withdrawal.amount);
    await wallet.save();
  }
  res.json({ success: true, message: 'Withdrawal approved', withdrawal });
};

exports.rejectWithdrawal = async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id).populate('coach');
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
  if (withdrawal.status !== 'pending') return res.status(400).json({ success: false, message: 'Withdrawal already processed' });
  withdrawal.status = 'rejected';
  await withdrawal.save();
  const Wallet = require('../models/Wallet');
  const wallet = await Wallet.findOne({ user: withdrawal.coach._id });
  if (wallet) {
    wallet.pendingWithdrawal = Math.max(0, (wallet.pendingWithdrawal || 0) - withdrawal.amount);
    wallet.balance = (wallet.balance || 0) + withdrawal.amount;
    await wallet.save();
  }
  await Transaction.create({
    user: withdrawal.coach._id,
    amount: withdrawal.amount,
    type: 'credit',
    reason: 'withdrawal_refund'
  });
  res.json({ success: true, message: 'Withdrawal rejected, funds returned', withdrawal });
};

exports.getOverview = async (req, res) => {
  const [
    totalStudents, totalCoaches, totalCourses, totalBookings, totalTransactions
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'coach' }),
    Course.countDocuments({ status: { $in: ['approved', 'published'] } }),
    Booking.countDocuments(),
    Transaction.countDocuments()
  ]);
  const revenueResult = await Transaction.aggregate([
    { $match: { type: 'credit', reason: { $in: ['wallet_topup', 'booking_payment', 'coach_earning'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
  const monthlyRevenue = await Transaction.aggregate([
    { $match: { type: 'credit', createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const monthlyRev = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;
  res.json({
    success: true,
    overview: {
      totalStudents, totalCoaches, totalCourses, totalBookings,
      totalTransactions, totalRevenue, monthlyRevenue: monthlyRev
    }
  });
};

exports.getRevenueAnalytics = async (req, res) => {
  const monthly = await Transaction.aggregate([
    { $match: { type: 'credit' } },
    { $group: {
      _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
      amount: { $sum: '$amount' },
      count: { $sum: 1 }
    }},
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  res.json({ success: true, revenue: monthly.map(m => ({ month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`, amount: m.amount, count: m.count })) });
};

exports.getUserGrowth = async (req, res) => {
  const growth = await User.aggregate([
    { $group: {
      _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
      count: { $sum: 1 }
    }},
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  res.json({ success: true, growth: growth.map(m => ({ month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`, count: m.count })) });
};

// Wrap all exports with asyncHandler to catch promise rejections
Object.keys(module.exports).forEach(key => {
  if (typeof module.exports[key] === 'function') {
    module.exports[key] = asyncHandler(module.exports[key]);
  }
});
