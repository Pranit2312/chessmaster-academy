const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { generateSlug, buildCourseFilterQuery, buildSortOptions } = require('../utils/courseValidation');

// Mock cloudinary for now since it's not in package.json
const cloudinary = {
  uploader: {
    upload: async () => ({ secure_url: 'https://via.placeholder.com/300' }),
    destroy: async () => ({ result: 'ok' })
  }
};

// ============================================
// COURSE CONTROLLERS
// ============================================

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Coach only)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, shortDescription, category, difficulty, language, objectives, prerequisites, pricing, targetAudience, tags, seoMetaDescription } = req.body;

    // Generate slug
    const slug = generateSlug(title);

    // Check if slug already exists
    const existingCourse = await Course.findOne({ slug });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'A course with this title already exists'
      });
    }

    // Calculate effective price
    let effectivePrice = pricing.price || 0;
    if (pricing.discountPercentage > 0) {
      effectivePrice = pricing.price - (pricing.price * pricing.discountPercentage) / 100;
    }

    const course = new Course({
      title,
      slug,
      description,
      shortDescription,
      category,
      difficulty: difficulty || 'Intermediate',
      language: language || 'English',
      instructor: req.user.id,
      objectives: objectives || [],
      prerequisites: prerequisites || [],
      targetAudience: targetAudience || [],
      pricing: {
        ...pricing,
        effectivePrice: Math.round(effectivePrice * 100) / 100
      },
      tags: tags || [],
      seoMetaDescription: seoMetaDescription || shortDescription
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
};

// @route   GET /api/courses
// @desc    Get all courses with filters and pagination
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, difficulty, isFree, search, sortBy = 'newest', instructor, minPrice, maxPrice } = req.query;

    // Build filter query
    const filters = {
      category,
      difficulty,
      isFree: isFree === 'true',
      search,
      instructor,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
    };

    const query = buildCourseFilterQuery(filters);
    const sortOptions = buildSortOptions(sortBy);

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Course.countDocuments(query);

    // Fetch courses
    const courses = await Course.find(query)
      .populate('instructor', 'name profileImage chessRating title')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// @route   GET /api/courses/:courseId
// @desc    Get course details with chapters and lessons
// @access  Public
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate('instructor', 'name profileImage chessRating title experience specializations bio')
      .populate('chapters')
      .populate('reviews');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Increment view count
    course.viewCount += 1;
    await course.save();

    // Check if user is enrolled (if logged in)
    let isEnrolled = false;
    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: courseId
      });
      isEnrolled = !!enrollment;
    }

    res.status(200).json({
      success: true,
      data: {
        ...course.toObject(),
        isEnrolled,
        enrollment: enrollment ? {
          progressPercentage: enrollment.progressPercentage,
          lastAccessedAt: enrollment.lastAccessedAt
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course details',
      error: error.message
    });
  }
};

// @route   PUT /api/courses/:courseId
// @desc    Update course details
// @access  Private (Course owner only)
exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, shortDescription, category, difficulty, language, objectives, prerequisites, pricing, tags, seoMetaDescription } = req.body;

    let course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    // Prevent editing published courses
    if (course.status === 'published' && course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit published courses. Archive and create a new version instead.'
      });
    }

    // Update fields
    if (title) {
      course.title = title;
      course.slug = generateSlug(title);
    }
    if (description) course.description = description;
    if (shortDescription) course.shortDescription = shortDescription;
    if (category) course.category = category;
    if (difficulty) course.difficulty = difficulty;
    if (language) course.language = language;
    if (objectives) course.objectives = objectives;
    if (prerequisites) course.prerequisites = prerequisites;
    if (tags) course.tags = tags;
    if (seoMetaDescription) course.seoMetaDescription = seoMetaDescription;

    // Update pricing
    if (pricing) {
      course.pricing = {
        ...course.pricing,
        ...pricing
      };
      // Recalculate effective price
      let effectivePrice = course.pricing.price || 0;
      if (course.pricing.discountPercentage > 0) {
        effectivePrice = course.pricing.price - (course.pricing.price * course.pricing.discountPercentage) / 100;
      }
      course.pricing.effectivePrice = Math.round(effectivePrice * 100) / 100;
    }

    course.updatedAt = Date.now();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
};

// @route   DELETE /api/courses/:courseId
// @desc    Delete/archive a course
// @access  Private (Course owner only)
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    // Archive instead of delete (for data integrity)
    course.status = 'archived';
    course.isPublished = false;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course archived successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};

// @route   GET /api/courses/coach/my-courses
// @desc    Get coach's courses
// @access  Private (Coach only)
exports.getCoachCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching coach courses', error: error.message });
  }
};

// @route   POST /api/courses/:courseId/publish
// @desc    Publish a course (submit for review)
// @access  Private (Course owner only)
exports.publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this course'
      });
    }

    // Validation checks
    if (course.chapters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course must have at least one chapter'
      });
    }

    // Check if course has content
    const chapters = await Chapter.find({ _id: { $in: course.chapters } });
    if (chapters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course chapters not found'
      });
    }

    // Update course status
    course.status = 'submitted';
    course.updatedAt = Date.now();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course submitted for review',
      data: course
    });
  } catch (error) {
    console.error('Error publishing course:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing course',
      error: error.message
    });
  }
};

// @route   GET /api/courses/:courseId/analytics
// @desc    Get course analytics
// @access  Private (Course owner or admin)
exports.getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this course analytics'
      });
    }

    // Get enrollment statistics
    const enrollments = await Enrollment.find({ course: courseId });
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(e => e.progressPercentage === 100).length;
    const activeEnrollments = enrollments.filter(e => e.enrollmentStatus === 'active').length;

    // Calculate revenue
    const totalRevenue = enrollments.reduce((sum, e) => sum + (e.pricePaid || 0), 0);
    const platformFee = totalRevenue * 0.25; // 25% platform commission
    const coachEarnings = totalRevenue * 0.75;

    // Get progress metrics
    const progressData = await Progress.find({ course: courseId });
    const avgWatchTime = progressData.length > 0
      ? Math.round(progressData.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0) / progressData.length / 60)
      : 0;

    // Get rating stats
    const reviews = course.reviews || [];
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        course: {
          title: course.title,
          category: course.category,
          status: course.status
        },
        enrollments: {
          total: totalEnrollments,
          active: activeEnrollments,
          completed: completedEnrollments,
          completionRate: totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : 0
        },
        revenue: {
          total: totalRevenue,
          platformFee,
          coachEarnings
        },
        engagement: {
          avgWatchTime,
          avgRating
        }
      }
    });
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course analytics',
      error: error.message
    });
  }
};

module.exports = exports;
