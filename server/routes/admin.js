const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, restrictTo('admin'));

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id/ban', adminController.banUser);
router.put('/users/:id/suspend', adminController.suspendUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/restore', adminController.restoreUser);

router.get('/coaches', adminController.getAllCoaches);
router.put('/coaches/:id/verify', adminController.verifyCoach);
router.put('/coaches/:id/reject', adminController.rejectCoach);
router.put('/coaches/:id/feature', adminController.featureCoach);
router.put('/coaches/:id/unfeature', adminController.unfeatureCoach);

router.get('/courses', adminController.getAllCourses);
router.put('/courses/:id/approve', adminController.approveCourse);
router.put('/courses/:id/reject', adminController.rejectCourse);
router.put('/courses/:id/feature', adminController.featureCourse);
router.delete('/courses/:id', adminController.deleteCourse);

router.get('/payments/transactions', adminController.getAllTransactions);
router.get('/withdrawals/pending', adminController.getPendingWithdrawals);
router.get('/withdrawals', adminController.getAllWithdrawals);
router.put('/withdrawals/:id/approve', adminController.approveWithdrawal);
router.put('/withdrawals/:id/reject', adminController.rejectWithdrawal);

router.get('/analytics/overview', adminController.getOverview);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/growth', adminController.getUserGrowth);

module.exports = router;
