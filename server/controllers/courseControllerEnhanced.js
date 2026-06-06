/**
 * Enhanced courseController with complete CRUD operations and filters
 */

const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Enrollment = require('../models/Enrollment');
const { ValidationError, NotFoundError, asyncHandler } = require('../utils/errors');
const { generateSlug, getPagination, formatResponse } = require('../utils/helpers');

/**
 * Create new course
 */
exports.createCourse = asyncHandler(async (req, res) => {
  const { title, description, shortDescription, category, difficulty, pricing, thumbnail } = req.body;

  // Validation
  if (!title || !description || !category || !difficulty) {
    throw new ValidationError('Missing required fields');
  }

  const slug = generateSlug(title);

  const course = await Course.create({
    title,
    description,
    shortDescription,
    category,
    difficulty,
    pricing,
    thumbnail,
    slug,
    instructor: req.user.id,
    status: 'draft'
  });

  res.status(201).json(formatResponse(true, 'Course created successfully', course));
});

/**
 * Get all courses with filtering and pagination
 */
exports.getCourses = asyncHandler(async (req, res) => {
  const { category, difficulty, search, instructor, minPrice, maxPrice, page, limit, sort } = req.query;

  const { skip, limit: pageLimit, page: pageNum } = getPagination(page, limit || 12);

  // Build filter object
  const filter = { status: 'published' };

  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (instructor) filter.instructor = instructor;
  
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (minPrice || maxPrice) {
    filter['pricing.effectivePrice'] = {};
    if (minPrice) filter['pricing.effectivePrice'].$gte = parseInt(minPrice);
    if (maxPrice) filter['pricing.effectivePrice'].$lte = parseInt(maxPrice);
  }

  // Sorting
  const sortObj = {};
  if (sort === 'newest') sortObj.createdAt = -1;
  else if (sort === 'popular') sortObj.enrollmentCount = -1;
  else if (sort === 'rating') sortObj.averageRating = -1;
  else if (sort === 'price-low') sortObj['pricing.effectivePrice'] = 1;
  else if (sort === 'price-high') sortObj['pricing.effectivePrice'] = -1;
  else sortObj.createdAt = -1;

  const courses = await Course.find(filter)
    .populate('instructor', 'name email avatar')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit)
    .lean();

  const total = await Course.countDocuments(filter);

  res.json(formatResponse(true, 'Courses retrieved successfully', courses, {
    total,
    page: pageNum,
    limit: pageLimit,
    pages: Math.ceil(total / pageLimit)
  }));
});

/**
 * Get single course by ID or slug
 */
exports.getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await Course.findOne({
    $or: [
      { _id: id },
      { slug: id }
    ]
  })
    .populate('instructor', 'name email avatar bio hourlyRate')
    .populate('chapters')
    .populate('reviews');

  if (!course) {
    throw new NotFoundError('Course');
  }

  res.json(formatResponse(true, 'Course retrieved successfully', course));
});

/**
 * Update course (owner only)
 */
exports.updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const course = await Course.findById(id);
  if (!course) {
    throw new NotFoundError('Course');
  }

  // Check ownership
  if (course.instructor.toString() !== req.user.id) {
    throw new AuthorizationError('Not authorized to update this course');
  }

  // Prevent status change directly
  if (updates.status && updates.status !== course.status) {
    delete updates.status;
  }

  if (updates.title && updates.title !== course.title) {
    updates.slug = generateSlug(updates.title);
  }

  Object.assign(course, updates);
  await course.save();

  res.json(formatResponse(true, 'Course updated successfully', course));
});

/**
 * Publish course (owner only)
 */
exports.publishCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await Course.findById(id);
  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.instructor.toString() !== req.user.id) {
    throw new AuthorizationError('Not authorized');
  }

  if (course.chapters.length === 0) {
    throw new ValidationError('Course must have at least one chapter');
  }

  course.status = 'published';
  course.publishedAt = new Date();
  await course.save();

  res.json(formatResponse(true, 'Course published successfully', course));
});

/**
 * Get courses by category
 */
exports.getCoursesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { limit = 12 } = req.query;

  const courses = await Course.find({
    category: category,
    status: 'published'
  })
    .populate('instructor', 'name email avatar')
    .limit(parseInt(limit))
    .lean();

  res.json(formatResponse(true, 'Courses retrieved successfully', courses));
});

/**
 * Search courses
 */
exports.searchCourses = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }

  const courses = await Course.find({
    $text: { $search: q },
    status: 'published'
  })
    .populate('instructor', 'name avatar')
    .limit(20)
    .lean();

  res.json(formatResponse(true, 'Search results', courses));
});

/**
 * Get course statistics
 */
exports.getCourseStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await Course.findById(id);
  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.instructor.toString() !== req.user.id) {
    throw new AuthorizationError('Not authorized');
  }

  const enrollmentCount = await Enrollment.countDocuments({ courseId: id });
  const reviewCount = await Review.countDocuments({ courseId: id });
  const totalRevenue = enrollmentCount * course.pricing.effectivePrice;

  res.json(formatResponse(true, 'Course statistics', {
    enrollmentCount,
    reviewCount,
    totalRevenue,
    averageRating: course.averageRating || 0
  }));
});

/**
 * Delete course (owner only)
 */
exports.deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await Course.findById(id);
  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.instructor.toString() !== req.user.id) {
    throw new AuthorizationError('Not authorized');
  }

  await Course.findByIdAndDelete(id);
  res.json(formatResponse(true, 'Course deleted successfully'));
});

module.exports = exports;
