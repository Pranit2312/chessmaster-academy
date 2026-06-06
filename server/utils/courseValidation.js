const { body, validationResult, param, query } = require('express-validator');

// ============================================
// COURSE VALIDATION SCHEMAS
// ============================================

const validateCourseCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Course title is required')
    .isLength({ min: 5, max: 150 }).withMessage('Title must be between 5 and 150 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Course description is required')
    .isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
  
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Short description cannot exceed 500 characters'),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Openings', 'Endgame', 'Tactics', 'Strategy', 'Middle Game', 'All Levels', 'Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid category'),
  
  body('difficulty')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('Invalid difficulty level'),
  
  body('objectives')
    .optional()
    .isArray().withMessage('Objectives must be an array'),
  
  body('objectives.*')
    .trim()
    .isLength({ max: 200 }).withMessage('Each objective must not exceed 200 characters'),
  
  body('language')
    .optional()
    .isIn(['English', 'Spanish', 'French', 'German', 'Russian', 'Hindi'])
    .withMessage('Invalid language'),
  
  body('pricing.isFree')
    .isBoolean().withMessage('isFree must be a boolean'),
  
  body('pricing.price')
    .if(() => !body('pricing.isFree').value === true)
    .isFloat({ min: 0 }).withMessage('Price must be greater than 0 for paid courses'),
  
  body('targetAudience')
    .optional()
    .isArray().withMessage('Target audience must be an array'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
];

const validateCourseUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 150 }).withMessage('Title must be between 5 and 150 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
  
  body('category')
    .optional()
    .isIn(['Openings', 'Endgame', 'Tactics', 'Strategy', 'Middle Game', 'All Levels', 'Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid category'),
  
  body('pricing.price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be greater than 0')
];

const validateChapterCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Chapter title is required')
    .isLength({ min: 3, max: 150 }).withMessage('Title must be between 3 and 150 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('orderIndex')
    .isInt({ min: 0 }).withMessage('Order index must be a non-negative integer')
];

const validateLessonCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Lesson title is required')
    .isLength({ min: 3, max: 150 }).withMessage('Title must be between 3 and 150 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  body('contentType')
    .notEmpty().withMessage('Content type is required')
    .isIn(['video', 'text', 'quiz', 'assignment', 'mixed'])
    .withMessage('Invalid content type'),
  
  body('orderIndex')
    .isInt({ min: 0 }).withMessage('Order index must be a non-negative integer'),
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1 }).withMessage('Estimated duration must be at least 1 minute'),
  
  body('learningObjectives')
    .optional()
    .isArray().withMessage('Learning objectives must be an array'),
  
  body('isPreview')
    .optional()
    .isBoolean().withMessage('isPreview must be a boolean')
];

const validateEnrollment = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  
  body('paymentId')
    .optional()
    .isMongoId().withMessage('Invalid payment ID')
];

const validateProgressUpdate = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['not_started', 'in_progress', 'completed'])
    .withMessage('Invalid status'),
  
  body('watchedDuration')
    .optional()
    .isInt({ min: 0 }).withMessage('Watched duration must be non-negative'),
  
  body('quizScore')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Quiz score must be between 0 and 100')
];

const validateCourseQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .isIn(['Openings', 'Endgame', 'Tactics', 'Strategy', 'Middle Game', 'All Levels', 'Beginner', 'Intermediate', 'Advanced']),
  
  query('difficulty')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'rating', 'price_low', 'price_high'])
    .withMessage('Invalid sort option'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query cannot exceed 100 characters')
];

const validateMongoId = [
  param('courseId').optional().isMongoId().withMessage('Invalid course ID format'),
  param('chapterId').optional().isMongoId().withMessage('Invalid chapter ID format'),
  param('lessonId').optional().isMongoId().withMessage('Invalid lesson ID format'),
  param('enrollmentId').optional().isMongoId().withMessage('Invalid enrollment ID format'),
  param('id').optional().isMongoId().withMessage('Invalid ID format')
];

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Generate certificate number
const generateCertificateNumber = () => {
  const date = new Date();
  const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `CERT-${timestamp}-${random}`;
};

// Generate verification code for certificate
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Calculate course duration
const calculateCourseDuration = (chapters) => {
  let totalDuration = 0;
  chapters.forEach(chapter => {
    if (chapter.totalDuration) {
      totalDuration += chapter.totalDuration;
    }
  });
  return Math.ceil(totalDuration / 60); // Convert to hours
};

// Calculate progress percentage
const calculateProgressPercentage = (lessonsCompleted, totalLessons) => {
  if (totalLessons === 0) return 0;
  return Math.round((lessonsCompleted / totalLessons) * 100);
};

// Format course price with discount
const formatCoursePrice = (price, discountPercentage) => {
  const discountAmount = (price * discountPercentage) / 100;
  const effectivePrice = price - discountAmount;
  return {
    originalPrice: price,
    discountPercentage: discountPercentage,
    discountAmount: Math.round(discountAmount * 100) / 100,
    effectivePrice: Math.round(effectivePrice * 100) / 100
  };
};

// Build course filter query
const buildCourseFilterQuery = (filters) => {
  const query = { status: 'published' };
  
  if (filters.category) query.category = filters.category;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.instructor) query.instructor = filters.instructor;
  
  if (filters.isFree) {
    query['pricing.isFree'] = true;
  } else if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query['pricing.effectivePrice'] = {};
    if (filters.minPrice !== undefined) query['pricing.effectivePrice'].$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query['pricing.effectivePrice'].$lte = filters.maxPrice;
  }
  
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { tags: { $in: [new RegExp(filters.search, 'i')] } }
    ];
  }
  
  return query;
};

// Build sort options
const buildSortOptions = (sortBy) => {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    popular: { enrollmentCount: -1 },
    rating: { averageRating: -1 },
    price_low: { 'pricing.effectivePrice': 1 },
    price_high: { 'pricing.effectivePrice': -1 }
  };
  
  return sortMap[sortBy] || { createdAt: -1 };
};

module.exports = {
  // Validators
  validateCourseCreation,
  validateCourseUpdate,
  validateChapterCreation,
  validateLessonCreation,
  validateEnrollment,
  validateProgressUpdate,
  validateCourseQuery,
  validateMongoId,
  
  // Middleware
  handleValidationErrors,
  
  // Helpers
  generateSlug,
  generateCertificateNumber,
  generateVerificationCode,
  calculateCourseDuration,
  calculateProgressPercentage,
  formatCoursePrice,
  buildCourseFilterQuery,
  buildSortOptions
};
