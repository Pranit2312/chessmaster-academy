const Achievement = require('../models/Achievement');
const { asyncHandler } = require('../utils/errors');

exports.getMine = async (req, res) => {
  const achievements = await Achievement.find({ user: req.user._id }).sort({ unlockedAt: -1 });
  res.json({ success: true, achievements });
};

exports.getAll = async (req, res) => {
  const { ACHIEVEMENT_DEFS } = require('../services/achievementService');
  const userAchievements = req.user ? await Achievement.find({ user: req.user._id }) : [];
  const userTypes = new Set(userAchievements.map(a => a.type));
  const all = Object.entries(ACHIEVEMENT_DEFS).map(([type, def]) => ({
    type, ...def, unlocked: userTypes.has(type)
  }));
  res.json({ success: true, achievements: all, userAchievements });
};

// Wrap all exports with asyncHandler to catch promise rejections
Object.keys(module.exports).forEach(key => {
  if (typeof module.exports[key] === 'function') {
    module.exports[key] = asyncHandler(module.exports[key]);
  }
});
