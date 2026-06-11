/**
 * Frontend constants
 */

export const ROLES = {
  STUDENT: 'student',
  COACH: 'coach',
  ADMIN: 'admin'
};

export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const CATEGORIES = [
  'Openings',
  'Endgame',
  'Tactics',
  'Strategy',
  'Middle Game'
];

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const COURSE_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
};

export const ENROLLMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  SUSPENDED: 'suspended'
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const API_ENDPOINTS = {
  AUTH: '/auth',
  COURSES: '/courses',
  ENROLLMENTS: '/enrollments',
  PROGRESS: '/progress',
  PAYMENTS: '/payments',
  USERS: '/users',
  WALLET: '/wallet',
  BOOKINGS: '/bookings',
  SLOTS: '/slots',
  REVIEWS: '/reviews'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  REGISTRATION_SUCCESS: 'Account created successfully!',
  COURSE_CREATED: 'Course created successfully!',
  ENROLLMENT_SUCCESS: 'Successfully enrolled in course!',
  PAYMENT_SUCCESS: 'Payment successful!',
  PROFILE_UPDATED: 'Profile updated successfully!'
};

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5005/api';

export const ITEMS_PER_PAGE = 12;

export const TIMEOUT = 30000; // 30 seconds

export default {
  ROLES,
  SKILL_LEVELS,
  CATEGORIES,
  DIFFICULTIES,
  COURSE_STATUS,
  ENROLLMENT_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  API_BASE_URL,
  ITEMS_PER_PAGE,
  TIMEOUT
};
