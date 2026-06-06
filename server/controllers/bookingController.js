const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const User = require('../models/User');

// 🆕 Level 2 imports
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const { PLATFORM_COMMISSION } = require('../config/commission');

// @desc    Create booking (Student books a slot)
// @route   POST /api/bookings
// @access  Private (Student)
exports.createBooking = async (req, res) => {
  try {
    const { slotId } = req.body;

    // 0️⃣ Get slot
    const slot = await Slot.findById(slotId);
    if (!slot || slot.isBooked || slot.status !== "available") {
      return res.status(400).json({ message: "Slot not available" });
    }

    // 1️⃣ Get student wallet
    const studentWallet = await Wallet.findOne({
      user: req.user.id,
      role: "student"
    });

    if (!studentWallet || studentWallet.balance < slot.price) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // 2️⃣ Debit student & move to escrow
    studentWallet.balance -= slot.price;
    studentWallet.escrowBalance += slot.price;  
    await studentWallet.save();

    // 3️⃣ Calculate commission + coach earning
    const commission = slot.price * 0.10;
    const coachEarning = slot.price - commission;

    // 4️⃣ Create booking
    const booking = await Booking.create({
      student: req.user.id,
      coach: slot.coach,
      slot: slot._id,
      amount: slot.price,
      commission,
      coachEarning,
      paymentStatus: "paid",
      sessionStatus: "scheduled",
      meetingLink: slot.meetingLink
    });

    // 5️⃣ Mark slot booked
    slot.isBooked = true;
    slot.status = "booked";
    slot.bookingId = booking._id;
    await slot.save();

    // 6️⃣ Transaction log
    await Transaction.create({
      user: req.user.id,
      amount: slot.price,
      type: "debit",
      reason: "slot_booking",
      bookingId: booking._id
    });

    return res.status(201).json({
      success: true,
      booking
    });

  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get student's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private (Student)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user.id })
      .populate('coach', 'name chessRating')
      .populate({
        path: 'slot',
        select: 'startTime endTime duration meetingLink meetingPlatform'
      })
      .sort({ createdAt: -1 });

    const normalizedBookings = bookings.map(b => ({
      ...b.toObject(),
      meetingLink: b.meetingLink || b.slot?.meetingLink || null
    }));

    res.status(200).json({
      success: true,
      bookings: normalizedBookings
    });

  } catch (error) {
    console.error("Get My Bookings Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get coach's bookings
// @route   GET /api/bookings/coach-bookings
// @access  Private (Coach)
exports.getCoachBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ coach: req.user.id })
      .populate('student', 'name email chessRating skillLevel')
      .populate('slot')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('student', 'name email chessRating')
      .populate('coach', 'name email chessRating title')
      .populate('slot');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (
      booking.student._id.toString() !== req.user.id &&
      booking.coach._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
  try {
    const { sessionStatus } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (
      booking.student.toString() !== req.user.id &&
      booking.coach.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.sessionStatus = sessionStatus;

    if (sessionStatus === 'completed') {
      const slot = await Slot.findById(booking.slot);
      slot.status = 'completed';
      await slot.save();
    }

    await booking.save();

    res.status(200).json({
      success: true,
      booking: await Booking.findById(booking._id)
        .populate('student coach slot')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('slot');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // ✅ Only scheduled bookings can be cancelled
    if (booking.sessionStatus !== 'scheduled') {
      return res.status(400).json({ message: 'Only scheduled bookings can be cancelled' });
    }

    // ✅ Update booking status
    booking.sessionStatus = 'cancelled';

    // If payment was done, mark as refunded
    if (booking.paymentStatus === 'completed') {
      booking.paymentStatus = 'refunded';
    }

    await booking.save();

    // ✅ Free the slot
    if (booking.slot) {
      booking.slot.isBooked = false;
      booking.slot.status = 'available';
      booking.slot.bookingId = null;
      await booking.slot.save();
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel Booking Error:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
};

// @desc    Add notes to booking
// @route   PUT /api/bookings/:id/notes
// @access  Private
exports.addNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (
      booking.student.toString() !== req.user.id &&
      booking.coach.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.student.toString() === req.user.id) {
      booking.studentNotes = notes;
    } else {
      booking.coachNotes = notes;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};