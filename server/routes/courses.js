const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const chapterLessonController = require('../controllers/chapterLessonController');
const enrollmentController = require('../controllers/enrollmentController');
const { protect, restrictTo } = require('../middleware/auth');
const authenticate = protect;
const authorize = restrictTo;
const { 
  validateCourseCreation, 
  validateCourseUpdate,
  validateChapterCreation,
  validateLessonCreation,
  validateEnrollment,
  validateProgressUpdate,
  validateCourseQuery,
  validateMongoId,
  handleValidationErrors 
} = require('../utils/courseValidation');

// ============================================
// COURSE ROUTES
// ============================================

// Create course (POST)
router.post(
  '/courses',
  authenticate,
  authorize('coach'),
  validateCourseCreation,
  handleValidationErrors,
  courseController.createCourse
);

// Get all courses with filters (GET)
router.get(
  '/courses',
  validateCourseQuery,
  handleValidationErrors,
  courseController.getCourses
);

// Get course details (GET)
router.get(
  '/courses/:courseId',
  validateMongoId,
  handleValidationErrors,
  courseController.getCourseDetails
);

// Update course (PUT)
router.put(
  '/courses/:courseId',
  authenticate,
  authorize('coach'),
  validateMongoId,
  validateCourseUpdate,
  handleValidationErrors,
  courseController.updateCourse
);

// Delete course (DELETE)
router.delete(
  '/courses/:courseId',
  authenticate,
  authorize('coach'),
  validateMongoId,
  handleValidationErrors,
  courseController.deleteCourse
);

// Publish course (POST)
router.post(
  '/courses/:courseId/publish',
  authenticate,
  authorize('coach'),
  validateMongoId,
  handleValidationErrors,
  courseController.publishCourse
);

// Get coach courses (GET)
router.get(
  '/courses/coach/my-courses',
  authenticate,
  authorize('coach'),
  courseController.getCoachCourses
);

// Get course analytics (GET)
router.get(
  '/courses/:courseId/analytics',
  authenticate,
  validateMongoId,
  handleValidationErrors,
  courseController.getCourseAnalytics
);

// ============================================
// CHAPTER ROUTES
// ============================================

// Create chapter (POST)
router.post(
  '/courses/:courseId/chapters',
  authenticate,
  authorize('coach'),
  validateMongoId,
  validateChapterCreation,
  handleValidationErrors,
  chapterLessonController.createChapter
);

// Get chapters (GET)
router.get(
  '/courses/:courseId/chapters',
  validateMongoId,
  handleValidationErrors,
  chapterLessonController.getChapters
);

// Update chapter (PUT)
router.put(
  '/courses/:courseId/chapters/:chapterId',
  authenticate,
  authorize('coach'),
  validateChapterCreation,
  handleValidationErrors,
  chapterLessonController.updateChapter
);

// Delete chapter (DELETE)
router.delete(
  '/courses/:courseId/chapters/:chapterId',
  authenticate,
  authorize('coach'),
  chapterLessonController.deleteChapter
);

// ============================================
// LESSON ROUTES
// ============================================

// Create lesson (POST)
router.post(
  '/chapters/:chapterId/lessons',
  authenticate,
  authorize('coach'),
  validateLessonCreation,
  handleValidationErrors,
  chapterLessonController.createLesson
);

// Get lessons (GET)
router.get(
  '/chapters/:chapterId/lessons',
  chapterLessonController.getLessons
);

// Get lesson details (GET)
router.get(
  '/lessons/:lessonId',
  chapterLessonController.getLessonDetails
);

// Update lesson (PUT)
router.put(
  '/lessons/:lessonId',
  authenticate,
  authorize('coach'),
  chapterLessonController.updateLesson
);

// Delete lesson (DELETE)
router.delete(
  '/lessons/:lessonId',
  authenticate,
  authorize('coach'),
  chapterLessonController.deleteLesson
);

// ============================================
// ENROLLMENT ROUTES
// ============================================

// Enroll in course (POST)
router.post(
  '/enrollments',
  authenticate,
  authorize('student'),
  validateEnrollment,
  handleValidationErrors,
  enrollmentController.enrollInCourse
);

// Verify payment (POST)
router.post(
  '/enrollments/verify-payment',
  authenticate,
  enrollmentController.verifyEnrollmentPayment
);

// Get student enrollments (GET)
router.get(
  '/enrollments/my-courses',
  authenticate,
  authorize('student'),
  enrollmentController.getStudentEnrollments
);

// Get enrollment details (GET)
router.get(
  '/enrollments/:enrollmentId',
  authenticate,
  enrollmentController.getEnrollmentDetails
);

// ============================================
// PROGRESS ROUTES
// ============================================

// Mark lesson complete (POST)
router.post(
  '/progress/:lessonId/complete',
  authenticate,
  authorize('student'),
  validateProgressUpdate,
  handleValidationErrors,
  enrollmentController.markLessonComplete
);

// Get course progress (GET)
router.get(
  '/progress/course/:courseId',
  authenticate,
  authorize('student'),
  enrollmentController.getCourseProgress
);

// ============================================
// CERTIFICATE ROUTES
// ============================================

// Generate certificate (POST)
router.post(
  '/certificates/:enrollmentId/generate',
  authenticate,
  authorize('student'),
  enrollmentController.generateCertificate
);

// Verify certificate (GET - Public)
router.get(
  '/certificates/:certificateNumber/verify',
  enrollmentController.verifyCertificate
);

// Get user certificates (GET)
router.get(
  '/certificates',
  authenticate,
  enrollmentController.getUserCertificates
);

module.exports = router;
