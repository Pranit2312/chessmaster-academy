const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const mc = require('../controllers/marketplaceController');

router.get('/marketplace', mc.getMarketplace);
router.get('/marketplace/:id', mc.getMarketplaceById);
router.post('/marketplace', protect, restrictTo('coach'), mc.createMarketplaceListing);
router.post('/marketplace/:id/purchase', protect, restrictTo('student'), mc.purchaseOpening);

module.exports = router;
