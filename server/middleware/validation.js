/**
 * Input Validation Middleware
 */

const { ValidationError } = require('../utils/errors');

/**
 * Validate email format
 */
exports.validateEmail = (req, res, next) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  next();
};

/**
 * Validate course data
 */
exports.validateCourseData = (req, res, next) => {
  const { title, description, category, difficulty, pricing } = req.body;

  if (!title || title.trim().length < 5) {
    throw new ValidationError('Title must be at least 5 characters');
  }

  if (!description || description.trim().length < 20) {
    throw new ValidationError('Description must be at least 20 characters');
  }

  if (!category) {
    throw new ValidationError('Category is required');
  }

  if (!difficulty) {
    throw new ValidationError('Difficulty is required');
  }

  if (!pricing || !pricing.price || pricing.price <= 0) {
    throw new ValidationError('Price must be greater than 0');
  }

  next();
};

/**
 * Validate pagination params
 */
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError('Page must be a positive number');
    }
  }

  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }
  }

  next();
};

/**
 * Validate booking data
 */
exports.validateBookingData = (req, res, next) => {
  const { coachId, slotId, duration } = req.body;

  if (!coachId) {
    throw new ValidationError('Coach ID is required');
  }

  if (!slotId) {
    throw new ValidationError('Slot ID is required');
  }

  if (!duration || duration < 15 || duration > 180) {
    throw new ValidationError('Duration must be between 15 and 180 minutes');
  }

  next();
};

/**
 * Validate payment data
 */
exports.validatePaymentData = (req, res, next) => {
  const { courseId, amount } = req.body;

  if (!courseId) {
    throw new ValidationError('Course ID is required');
  }

  if (!amount || amount <= 0) {
    throw new ValidationError('Amount must be greater than 0');
  }

  next();
};

module.exports = exports;
