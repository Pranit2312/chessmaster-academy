const { body, param, validationResult } = require('express-validator');

const validateSubmitAnalysis = [
  body('pgn')
    .trim()
    .notEmpty()
    .withMessage('PGN is required')
    .isLength({ max: 50000 })
    .withMessage('PGN is too long (max 50000 characters)'),
  body('depth')
    .optional()
    .isInt({ min: 10, max: 50 })
    .withMessage('Depth must be between 10 and 50')
];

const validateAnalysisId = [
  param('analysisId')
    .isMongoId()
    .withMessage('Invalid analysis ID')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateSubmitAnalysis,
  validateAnalysisId,
  handleValidationErrors
};
