/**
 * Session Management Utility
 * Handles session creation, management, and booking flow
 */

const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

/**
 * Create a new session/booking when student books a slot
 */
exports.createSession = async (studentId, slotId, sessionData) => {
  try {
    // Verify slot exists and is available
    const slot = await Slot.findById(slotId).populate('coachId');
    if (!slot) {
      throw new Error('Slot not found');
    }

    if (slot.isBooked || slot.status !== 'available') {
      throw new Error('Slot is not available');
    }
    const effectiveCapacity = slot.capacity || 1;
    if (effectiveCapacity > 1 && (slot.currentBookings || 0) >= effectiveCapacity) {
      throw new Error('Slot is fully booked');
    }

    // Get student details
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Get coach details
    const coach = slot.coachId;

    // Check if student has sufficient wallet balance
    const studentWallet = await Wallet.findOne({ userId: studentId });
    if (!studentWallet || studentWallet.balance < (slot.price || 500)) {
      throw new Error('Insufficient wallet balance');
    }

    // Create booking/session
    const booking = await Booking.create({
      studentId,
      coachId: coach._id,
      slotId,
      sessionDate: slot.date,
      startTime: slot.startTime,
      duration: slot.duration,
      status: 'confirmed',
      price: slot.price || 500,
      meetingLink: slot.meetingLink || '',
      meetingPlatform: slot.meetingPlatform || 'Zoom',
      notes: sessionData?.notes || '',
      skillLevel: sessionData?.skillLevel || 'intermediate'
    });

    // Update slot to mark as booked (group-aware)
    const slotDoc = await Slot.findById(slotId);
    if (slotDoc) {
      slotDoc.currentBookings = (slotDoc.currentBookings || 0) + 1;
      const slotCapacity = slotDoc.capacity || 1;
      if (slotCapacity === 1 || slotDoc.currentBookings >= slotCapacity) {
        slotDoc.isBooked = true;
        slotDoc.status = 'booked';
      }
      await slotDoc.save();
    }

    // Deduct from student wallet
    await Wallet.findByIdAndUpdate(studentId, {
      $inc: { balance: -(slot.price || 500) }
    });

    // Add transaction record
    await Transaction.create({
      userId: studentId,
      type: 'debit',
      amount: slot.price || 500,
      description: `Booked coaching session with ${coach.firstName} ${coach.lastName}`,
      bookingId: booking._id,
      balanceBefore: studentWallet.balance,
      balanceAfter: studentWallet.balance - (slot.price || 500)
    });

    // Add to coach wallet
    const coachWallet = await Wallet.findOne({ userId: coach._id });
    if (coachWallet) {
      const coachEarnings = (slot.price || 500) * 0.8; // Coach gets 80%
      await Wallet.findByIdAndUpdate(coach._id, {
        $inc: { balance: coachEarnings }
      });

      await Transaction.create({
        userId: coach._id,
        type: 'credit',
        amount: coachEarnings,
        description: `Session booking from ${student.firstName} ${student.lastName}`,
        bookingId: booking._id,
        balanceBefore: coachWallet.balance,
        balanceAfter: coachWallet.balance + coachEarnings
      });
    }

    return {
      success: true,
      message: 'Session booked successfully',
      booking,
      sessionDetails: {
        coachName: `${coach.firstName} ${coach.lastName}`,
        date: slot.date,
        time: slot.startTime,
        duration: slot.duration,
        meetingLink: slot.meetingLink,
        meetingPlatform: slot.meetingPlatform
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Get all sessions for a student
 */
exports.getStudentSessions = async (studentId, filters = {}) => {
  try {
    const query = { studentId };

    if (filters.status) query.status = filters.status;
    if (filters.coachId) query.coachId = filters.coachId;

    const sessions = await Booking.find(query)
      .populate('coachId', 'firstName lastName profilePicture chessRating')
      .sort({ sessionDate: -1 })
      .lean();

    const summary = {
      total: sessions.length,
      completed: sessions.filter(s => s.status === 'completed').length,
      confirmed: sessions.filter(s => s.status === 'confirmed').length,
      cancelled: sessions.filter(s => s.status === 'cancelled').length,
      pending: sessions.filter(s => s.status === 'pending').length
    };

    return {
      success: true,
      sessions,
      summary
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Get all sessions for a coach (students booked with coach)
 */
exports.getCoachSessions = async (coachId, filters = {}) => {
  try {
    const query = { coachId };

    if (filters.status) query.status = filters.status;
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
      query.sessionDate = { $gte: startDate, $lte: endDate };
    }

    const sessions = await Booking.find(query)
      .populate('studentId', 'firstName lastName email profilePicture chessRating')
      .sort({ sessionDate: -1 })
      .lean();

    const summary = {
      total: sessions.length,
      completed: sessions.filter(s => s.status === 'completed').length,
      confirmed: sessions.filter(s => s.status === 'confirmed').length,
      cancelled: sessions.filter(s => s.status === 'cancelled').length,
      pending: sessions.filter(s => s.status === 'pending').length,
      totalEarnings: sessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.price * 0.8), 0)
    };

    return {
      success: true,
      sessions,
      summary
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Update session status
 */
exports.updateSessionStatus = async (sessionId, newStatus, coachId = null) => {
  try {
    const session = await Booking.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Only coach or admin can update session
    if (coachId && session.coachId.toString() !== coachId.toString()) {
      throw new Error('Not authorized to update this session');
    }

    const oldStatus = session.status;
    session.status = newStatus;

    if (newStatus === 'completed') {
      session.completedAt = new Date();
    } else if (newStatus === 'cancelled') {
      session.cancelledAt = new Date();
      // Refund to student if cancelled
      await refundSession(sessionId);
    }

    await session.save();

    return {
      success: true,
      message: `Session status updated to ${newStatus}`,
      session,
      statusChanged: { from: oldStatus, to: newStatus }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Cancel session and refund
 */
const refundSession = async (sessionId) => {
  try {
    const session = await Booking.findById(sessionId);
    if (!session) return;

    const refundAmount = session.price * 0.9; // Refund 90%
    
    // Add refund to student wallet
    await Wallet.findByIdAndUpdate(session.studentId, {
      $inc: { balance: refundAmount }
    });

    // Record transaction
    await Transaction.create({
      userId: session.studentId,
      type: 'credit',
      amount: refundAmount,
      description: 'Session cancellation refund',
      bookingId: sessionId
    });

    // Remove from coach wallet
    const coachEarnings = session.price * 0.8;
    await Wallet.findByIdAndUpdate(session.coachId, {
      $inc: { balance: -coachEarnings }
    });
  } catch (error) {
    console.error('Refund error:', error);
  }
};

/**
 * Get session details
 */
exports.getSessionDetails = async (sessionId) => {
  try {
    const session = await Booking.findById(sessionId)
      .populate('studentId', 'firstName lastName email profilePicture chessRating')
      .populate('coachId', 'firstName lastName profilePicture chessRating title')
      .populate('slotId');

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      success: true,
      session
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Complete session
 */
exports.completeSession = async (sessionId, coachNotes = '') => {
  try {
    const session = await Booking.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'completed';
    session.completedAt = new Date();
    session.coachNotes = coachNotes;

    await session.save();

    return {
      success: true,
      message: 'Session marked as completed',
      session
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Get upcoming sessions for a user (coach or student)
 */
exports.getUpcomingSessions = async (userId, userType = 'student') => {
  try {
    const query = userType === 'student' 
      ? { studentId: userId }
      : { coachId: userId };

    query.sessionDate = { $gte: new Date() };
    query.status = { $in: ['confirmed', 'pending'] };

    const sessions = await Booking.find(query)
      .sort({ sessionDate: 1 })
      .limit(10)
      .populate(
        userType === 'student' 
          ? 'coachId' 
          : 'studentId',
        'firstName lastName profilePicture'
      );

    return {
      success: true,
      sessions,
      count: sessions.length
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Get session statistics
 */
exports.getSessionStats = async (coachId) => {
  try {
    const sessions = await Booking.find({ coachId });

    const stats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      upcomingSessions: sessions.filter(s => s.status === 'confirmed' && s.sessionDate > new Date()).length,
      cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
      totalEarnings: sessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.price * 0.8), 0),
      averageRating: sessions.length > 0 
        ? (sessions.reduce((sum, s) => sum + (s.studentRating || 0), 0) / sessions.length)
        : 0
    };

    return {
      success: true,
      stats
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Generate Zoom meeting link for confirmed session
 */
exports.generateSessionZoomLink = async (sessionId, coachId) => {
  try {
    const zoomIntegration = require('./zoomIntegration');
    const session = await Booking.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Verify coach owns this session
    if (session.coachId.toString() !== coachId.toString()) {
      throw new Error('Not authorized');
    }

    // If already has link, return existing
    if (session.meetingLink) {
      return {
        success: true,
        meetingLink: session.meetingLink,
        meetingPassword: session.meetingPassword,
        platform: session.meetingPlatform
      };
    }

    // Generate new Zoom meeting
    const meetingDetails = await zoomIntegration.generateZoomMeeting(
      sessionId,
      coachId,
      session.sessionDate
    );

    if (!meetingDetails.success) {
      throw new Error(meetingDetails.message);
    }

    // Update session with meeting link
    session.meetingLink = meetingDetails.joinUrl;
    session.meetingPassword = meetingDetails.passcode;
    session.meetingPlatform = 'Zoom';
    await session.save();

    return {
      success: true,
      meetingLink: meetingDetails.joinUrl,
      meetingId: meetingDetails.meetingId,
      meetingPassword: meetingDetails.passcode,
      zoomLink: meetingDetails.zoomLink,
      platform: 'Zoom'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = exports;
