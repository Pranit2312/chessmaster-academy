/**
 * Authorization Middleware
 */

const User = require('../models/User');
const { AuthorizationError, NotFoundError } = require('../utils/errors');

/**
 * Check if user has specific role
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(`This action requires one of these roles: ${allowedRoles.join(', ')}`);
    }
    next();
  };
};

/**
 * Middleware for coach-only endpoints
 */
exports.coachOnly = checkRole(['coach', 'admin']);

/**
 * Middleware for student-only endpoints
 */
exports.studentOnly = checkRole(['student', 'admin']);

/**
 * Middleware for admin-only endpoints
 */
exports.adminOnly = checkRole(['admin']);

/**
 * Check resource ownership
 */
exports.checkOwnership = (resourceField = 'userId') => {
  return async (req, res, next) => {
    const resourceId = req.params.id;
    const userId = req.user.id;

    // For different resource types, fetch and check
    let owner;
    if (req.route.path.includes('/courses')) {
      const Course = require('../models/Course');
      const course = await Course.findById(resourceId);
      owner = course?.instructor;
    } else if (req.route.path.includes('/enrollments')) {
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findById(resourceId);
      owner = enrollment?.userId;
    } else if (req.route.path.includes('/bookings')) {
      const Booking = require('../models/Booking');
      const booking = await Booking.findById(resourceId);
      owner = booking?.studentId;
    }

    if (!owner) {
      throw new NotFoundError('Resource');
    }

    if (owner.toString() !== userId) {
      throw new AuthorizationError('You do not own this resource');
    }

    next();
  };
};

/**
 * Check if user is verified
 */
exports.verifiedOnly = (req, res, next) => {
  const user = req.user;

  if (!user.emailVerified) {
    throw new AuthorizationError('Please verify your email first');
  }

  next();
};

/**
 * Check if user has completed profile
 */
exports.profileComplete = async (req, res, next) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.id);

  if (!user.profile?.bio || !user.profile?.phoneNumber) {
    throw new AuthorizationError('Please complete your profile first');
  }

  next();
};

module.exports = exports;
