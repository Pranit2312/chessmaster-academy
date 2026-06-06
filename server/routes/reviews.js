const express = require('express');
const router = express.Router();
const {
  createReview,
  getCoachReviews,
  getCourseReviews,
  getMyReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('student'), createReview);
router.get('/coach/:coachId', getCoachReviews);
router.get('/course/:courseId', getCourseReviews);
router.get('/my-reviews', protect, restrictTo('student'), getMyReviews);
router.put('/:id', protect, restrictTo('student'), updateReview);
router.delete('/:id', protect, restrictTo('student'), deleteReview);

module.exports = router;