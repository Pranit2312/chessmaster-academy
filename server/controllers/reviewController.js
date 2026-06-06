const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private (Student)
exports.createReview = async (req, res) => {
  try {
    const { 
      bookingId, 
      rating, 
      comment, 
      teachingQuality, 
      communication, 
      punctuality,
      wouldRecommend 
    } = req.body;

    // Check if booking exists and belongs to student
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    if (booking.sessionStatus !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed sessions' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }

    // Create review
    const review = await Review.create({
      booking: bookingId,
      student: req.user.id,
      coach: booking.coach,
      rating,
      comment,
      teachingQuality,
      communication,
      punctuality,
      wouldRecommend
    });

    // Update coach's average rating
    const coachReviews = await Review.find({ coach: booking.coach });
    const avgRating = coachReviews.reduce((sum, r) => sum + r.rating, 0) / coachReviews.length;

    await User.findByIdAndUpdate(booking.coach, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: coachReviews.length
    });

    res.status(201).json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Create Review Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reviews for a coach
// @route   GET /api/reviews/coach/:coachId
// @access  Public
exports.getCoachReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ coach: req.params.coachId })
      .populate('student', 'name chessRating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reviews for a course
// @route   GET /api/reviews/course/:courseId
// @access  Public
exports.getCourseReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId })
      .populate('student', 'name chessRating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get student's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private (Student)
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ student: req.user.id })
      .populate('coach', 'name chessRating')
      .populate('booking')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Student)
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const allowedUpdates = ['rating', 'comment', 'teachingQuality', 'communication', 'punctuality', 'wouldRecommend'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    await review.save();

    // Recalculate coach's average rating
    const coachReviews = await Review.find({ coach: review.coach });
    const avgRating = coachReviews.reduce((sum, r) => sum + r.rating, 0) / coachReviews.length;

    await User.findByIdAndUpdate(review.coach, {
      averageRating: Math.round(avgRating * 10) / 10
    });

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Student)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const coachId = review.coach;
    await review.deleteOne();

    // Recalculate coach's average rating
    const coachReviews = await Review.find({ coach: coachId });
    const avgRating = coachReviews.length > 0 
      ? coachReviews.reduce((sum, r) => sum + r.rating, 0) / coachReviews.length 
      : 0;

    await User.findByIdAndUpdate(coachId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: coachReviews.length
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};