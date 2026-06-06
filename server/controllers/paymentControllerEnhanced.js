/**
 * Payment controller with Razorpay and Stripe integration
 */

const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Razorpay = require('razorpay');
const { ValidationError, NotFoundError, ConflictError, asyncHandler } = require('../utils/errors');
const { formatResponse } = require('../utils/helpers');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Initialize Razorpay payment
 */
exports.initializeRazorpayPayment = asyncHandler(async (req, res) => {
  const { courseId, amount } = req.body;

  if (!courseId || !amount) {
    throw new ValidationError('Missing required fields');
  }

  const options = {
    amount: Math.round(amount * 100), // Razorpay expects amount in paise
    currency: 'INR',
    receipt: `order_${Date.now()}`,
    notes: {
      userId: req.user.id,
      courseId: courseId
    }
  };

  const order = await razorpay.orders.create(options);

  res.json(formatResponse(true, 'Razorpay order created', {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt
  }));
});

/**
 * Verify Razorpay payment
 */
exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ValidationError('Missing payment verification details');
  }

  // Verify signature
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new ValidationError('Payment signature verification failed');
  }

  // Fetch payment details
  const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);

  if (paymentDetails.status !== 'captured') {
    throw new ValidationError('Payment not captured');
  }

  // Create payment record
  const payment = await Payment.create({
    userId: req.user.id,
    courseId,
    gateway: 'razorpay',
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    amount: paymentDetails.amount / 100,
    status: 'completed',
    metadata: paymentDetails
  });

  // Create enrollment
  await Enrollment.create({
    userId: req.user.id,
    courseId,
    paymentId: payment._id,
    status: 'active'
  });

  // Add to wallet (for coaches)
  const course = await Course.findById(courseId);
  const coachWallet = await Wallet.findOne({ userId: course.instructor });
  if (coachWallet) {
    const earning = paymentDetails.amount / 100 * (100 - 20) / 100; // 20% platform fee
    coachWallet.balance += earning;
    await coachWallet.save();

    // Log transaction
    await Transaction.create({
      walletId: coachWallet._id,
      type: 'credit',
      amount: earning,
      description: `Earnings from course sale: ${course.title}`
    });
  }

  res.json(formatResponse(true, 'Payment verified successfully', {
    paymentId: payment._id,
    status: 'completed',
    enrollmentId: enrollment._id
  }));
});

/**
 * Get payment history
 */
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const filter = { userId: req.user.id };
  if (status) filter.status = status;

  const payments = await Payment.find(filter)
    .populate('courseId', 'title thumbnail')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(filter);

  res.json(formatResponse(true, 'Payment history retrieved', payments, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  }));
});

/**
 * Refund payment
 */
exports.refundPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { reason } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new NotFoundError('Payment');
  }

  if (payment.userId.toString() !== req.user.id) {
    throw new ValidationError('Not authorized to refund this payment');
  }

  if (payment.status === 'refunded') {
    throw new ConflictError('Payment already refunded');
  }

  // Process refund with Razorpay
  if (payment.gateway === 'razorpay') {
    const refund = await razorpay.payments.refund(payment.paymentId, {
      amount: Math.round(payment.amount * 100),
      notes: {
        reason: reason || 'Customer requested refund'
      }
    });

    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundReason = reason;
    await payment.save();

    // Remove enrollment
    await Enrollment.deleteOne({ paymentId: payment._id });

    // Reverse wallet credit
    const course = await Course.findById(payment.courseId);
    const coachWallet = await Wallet.findOne({ userId: course.instructor });
    if (coachWallet) {
      const earning = payment.amount * (100 - 20) / 100;
      coachWallet.balance -= earning;
      await coachWallet.save();

      await Transaction.create({
        walletId: coachWallet._id,
        type: 'debit',
        amount: earning,
        description: `Refund for course: ${course.title}`
      });
    }
  }

  res.json(formatResponse(true, 'Payment refunded successfully', payment));
});

module.exports = exports;
