const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const User = require('../models/User');

// Initialize Razorpay - with error handling
const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  console.warn('⚠️  Razorpay keys not configured');
  return null;
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private (Student)
exports.createOrder = async (req, res) => {
  try {
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({ 
        success: false,
        message: 'Payment service temporarily unavailable' 
      });
    }

    const { slotId, amount } = req.body;

    const slot = await Slot.findById(slotId).populate('coach');
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Prevent duplicate bookings
    const existingBooking = await Booking.findOne({
      slot: slotId,
      paymentStatus: { $in: ['pending', 'completed'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Slot already booked' });
    }

    if (slot.isBooked || slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot not available' });
    }

    // 🟢 Commission Logic (10%)
    const commission = Math.round(amount * 0.10);
    const coachEarning = amount - commission;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // ensures integer
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    const booking = await Booking.create({
      student: req.user.id,
      coach: slot.coach._id,
      slot: slot._id,
      amount,
      commission,
      coachEarning,
      razorpayOrderId: order.id,
      paymentStatus: 'pending',
      sessionStatus: 'scheduled'
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: booking._id,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

// @desc    Verify payment and complete booking
// @route   POST /api/payments/verify
// @access  Private (Student)
exports.verifyPayment = async (req, res) => {
  try {
    const razorpay = getRazorpayInstance();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    const booking = await Booking.findById(bookingId).populate('slot');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Prevent double verification
    if (booking.paymentStatus === 'completed') {
      return res.json({ success: true, message: 'Payment already verified' });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update booking
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paymentStatus = 'completed';
    booking.sessionStatus = 'scheduled';
    booking.meetingLink = booking.slot.meetingLink;

    // 🟢 Recalculate commission safely
    booking.commission = Math.round(booking.amount * 0.10);
    booking.coachEarning = booking.amount - booking.commission;

    await booking.save();

    // Mark slot booked
    const slot = await Slot.findById(booking.slot._id);
    slot.isBooked = true;
    slot.status = 'booked';
    slot.bookingId = booking._id;
    await slot.save();

    // Update stats
    await User.findByIdAndUpdate(booking.coach, {
      $inc: { totalSessions: 1 }
    });

    await User.findByIdAndUpdate(booking.student, {
      $inc: { totalSessions: 1 }
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:bookingId
// @access  Private
exports.getPaymentDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('student', 'name email')
      .populate('coach', 'name email')
      .populate('slot');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({
      success: true,
      booking
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify Razorpay signature
// @route   POST /api/payments/verify-signature
// @access  Private
exports.verifySignature = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      res.status(200).json({ success: true, message: 'Signature verified' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};