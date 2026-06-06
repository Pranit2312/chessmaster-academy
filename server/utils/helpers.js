/**
 * Helper utility functions
 */

/**
 * Generate slug from text
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Calculate pagination
 */
const getPagination = (page = 1, limit = 10) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  return { skip, limit: limitNum, page: pageNum };
};

/**
 * Build query filters safely
 */
const buildQueryFilters = (queryParams, allowedFields) => {
  const filters = {};
  
  allowedFields.forEach(field => {
    if (queryParams[field] !== undefined && queryParams[field] !== '') {
      filters[field] = queryParams[field];
    }
  });
  
  return filters;
};

/**
 * Generate random code
 */
const generateRandomCode = (length = 6) => {
  return Math.random().toString(36).substr(2, length).toUpperCase();
};

/**
 * Check if user owns resource
 */
const checkOwnership = (resourceOwnerId, userId) => {
  return resourceOwnerId.toString() === userId.toString();
};

/**
 * Calculate percentage
 */
const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};

/**
 * Format API response
 */
const formatResponse = (success, message, data = null, meta = null) => {
  return {
    success,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Sanitize user data (remove sensitive fields)
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

/**
 * Check if date is in past
 */
const isPastDate = (date) => {
  return new Date(date) < new Date();
};

/**
 * Check if date is in future
 */
const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * Get time difference in days
 */
const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
};

module.exports = {
  generateSlug,
  getPagination,
  buildQueryFilters,
  generateRandomCode,
  checkOwnership,
  calculatePercentage,
  formatResponse,
  validateEmail,
  sanitizeUser,
  isPastDate,
  isFutureDate,
  getDaysDifference
};
