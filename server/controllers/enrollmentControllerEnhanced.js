/**
 * Enrollment Controller with enhanced methods
 */

const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { ValidationError, NotFoundError, asyncHandler } = require('../utils/errors');
const { formatResponse, checkOwnership } = require('../utils/helpers');

/**
 * Enroll in course
 */
exports.enrollCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    throw new ValidationError('Course ID is required');
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course');
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    userId: req.user.id,
    courseId
  });

  if (existingEnrollment) {
    throw new ValidationError('You are already enrolled in this course');
  }

  // Create enrollment
  const enrollment = await Enrollment.create({
    userId: req.user.id,
    courseId,
    status: 'active',
    enrolledAt: new Date()
  });

  // Create progress tracking
  await Progress.create({
    userId: req.user.id,
    courseId,
    lessonsCompleted: [],
    completionPercentage: 0
  });

  // Update course enrollment count
  course.enrollmentCount = (course.enrollmentCount || 0) + 1;
  await course.save();

  res.status(201).json(formatResponse(true, 'Enrolled successfully', enrollment));
});

/**
 * Get my enrollments
 */
exports.getMyEnrollments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const filter = { userId: req.user.id };
  if (status && ['active', 'completed', 'dropped', 'suspended'].includes(status)) {
    filter.status = status;
  }

  const enrollments = await Enrollment.find(filter)
    .populate('courseId', 'title thumbnail category')
    .sort({ enrolledAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get progress for each enrollment
  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progress = await Progress.findOne({
        userId: req.user.id,
        courseId: enrollment.courseId._id
      });

      return {
        ...enrollment.toObject(),
        progress: progress?.completionPercentage || 0
      };
    })
  );

  const total = await Enrollment.countDocuments(filter);

  res.json(formatResponse(true, 'Enrollments retrieved', enrollmentsWithProgress, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  }));
});

/**
 * Get enrollment details
 */
exports.getEnrollmentDetails = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findById(enrollmentId)
    .populate('userId', 'name email')
    .populate('courseId');

  if (!enrollment) {
    throw new NotFoundError('Enrollment');
  }

  if (enrollment.userId._id.toString() !== req.user.id && enrollment.courseId.instructor.toString() !== req.user.id) {
    throw new ValidationError('Not authorized to view this enrollment');
  }

  const progress = await Progress.findOne({
    userId: enrollment.userId._id,
    courseId: enrollment.courseId._id
  });

  res.json(formatResponse(true, 'Enrollment details retrieved', {
    ...enrollment.toObject(),
    progress: progress?.toObject()
  }));
});

/**
 * Update enrollment status
 */
exports.updateEnrollmentStatus = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'completed', 'suspended'].includes(status)) {
    throw new ValidationError('Invalid status');
  }

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new NotFoundError('Enrollment');
  }

  // Check authorization
  const course = await Course.findById(enrollment.courseId);
  if (course.instructor.toString() !== req.user.id && enrollment.userId.toString() !== req.user.id) {
    throw new ValidationError('Not authorized');
  }

  enrollment.status = status;
  if (status === 'completed') {
    enrollment.completedAt = new Date();
  }
  await enrollment.save();

  res.json(formatResponse(true, 'Enrollment status updated', enrollment));
});

/**
 * Drop course
 */
exports.dropCourse = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new NotFoundError('Enrollment');
  }

  if (enrollment.userId.toString() !== req.user.id) {
    throw new ValidationError('Not authorized to drop this course');
  }

  // Check if course can be dropped (within refund period, e.g., 30 days)
  const enrolledDaysAgo = Math.floor((new Date() - enrollment.enrolledAt) / (1000 * 60 * 60 * 24));
  const refundEligible = enrolledDaysAgo <= 30;

  enrollment.status = 'dropped';
  enrollment.droppedAt = new Date();
  await enrollment.save();

  // Update course enrollment count
  const course = await Course.findById(enrollment.courseId);
  course.enrollmentCount = Math.max(0, (course.enrollmentCount || 1) - 1);
  await course.save();

  res.json(formatResponse(true, 'Course dropped successfully', {
    enrollment,
    refundEligible,
    message: refundEligible ? 'You are eligible for a refund' : 'Refund period has expired'
  }));
});

/**
 * Get enrollments by course (for coaches)
 */
exports.getCourseEnrollments = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.instructor.toString() !== req.user.id) {
    throw new ValidationError('Not authorized');
  }

  const skip = (page - 1) * limit;

  const enrollments = await Enrollment.find({ courseId })
    .populate('userId', 'name email')
    .sort({ enrolledAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Enrollment.countDocuments({ courseId });

  res.json(formatResponse(true, 'Course enrollments retrieved', enrollments, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  }));
});

module.exports = exports;
