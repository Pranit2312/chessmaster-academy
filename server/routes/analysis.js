const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const analysisController = require('../controllers/analysisController');
const {
  validateSubmitAnalysis,
  validateAnalysisId,
  handleValidationErrors
} = require('../utils/analysisValidation');

router.use(protect);

router.post(
  '/submit',
  validateSubmitAnalysis,
  handleValidationErrors,
  analysisController.submitAnalysis
);

router.get('/my-analyses', analysisController.getMyAnalyses);

router.get(
  '/:analysisId/status',
  validateAnalysisId,
  handleValidationErrors,
  analysisController.getAnalysisStatus
);

router.get(
  '/:analysisId',
  validateAnalysisId,
  handleValidationErrors,
  analysisController.getAnalysisById
);

router.delete(
  '/:analysisId',
  validateAnalysisId,
  handleValidationErrors,
  analysisController.deleteAnalysis
);

module.exports = router;
