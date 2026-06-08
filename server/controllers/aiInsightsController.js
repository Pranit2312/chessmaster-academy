const AiInsight = require('../models/AiInsight');
const { generateWeaknessInsights, generateRecommendationInsights, getSkillAssessment } = require('../services/insightService');

exports.getWeaknessAnalysis = async (req, res) => {
  try {
    let insights = await AiInsight.find({
      user: req.user._id,
      type: { $in: ['weakness', 'strength'] },
      isDismissed: false
    }).sort({ generatedAt: -1 }).lean();

    if (insights.length === 0) {
      const generated = await generateWeaknessInsights(req.user._id);
      insights = generated.map(g => g.toObject ? g.toObject() : g);
    }

    res.json({ success: true, insights });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get weakness analysis', error: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    let insights = await AiInsight.find({
      user: req.user._id,
      type: 'recommendation',
      isDismissed: false
    }).populate('relatedCourse', 'title thumbnail category difficulty')
      .sort({ generatedAt: -1 })
      .lean();

    if (insights.length === 0) {
      const generated = await generateRecommendationInsights(req.user._id);
      insights = await AiInsight.find({
        _id: { $in: generated.map(g => g._id) }
      }).populate('relatedCourse', 'title thumbnail category difficulty')
        .sort({ generatedAt: -1 })
        .lean();
    }

    res.json({ success: true, insights });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get recommendations', error: error.message });
  }
};

exports.getProgressInsights = async (req, res) => {
  try {
    const insights = await AiInsight.find({
      user: req.user._id,
      type: { $in: ['milestone', 'trend'] },
      isDismissed: false
    }).sort({ generatedAt: -1 })
      .limit(10)
      .lean();

    res.json({ success: true, insights });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get progress insights', error: error.message });
  }
};

exports.getSkillAssessment = async (req, res) => {
  try {
    const assessment = await getSkillAssessment(req.user._id);
    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get skill assessment', error: error.message });
  }
};

exports.dismissInsight = async (req, res) => {
  try {
    const insight = await AiInsight.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDismissed: true },
      { new: true }
    );

    if (!insight) {
      return res.status(404).json({ success: false, message: 'Insight not found' });
    }

    res.json({ success: true, message: 'Insight dismissed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to dismiss insight', error: error.message });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const [weaknesses, recommendations, milestones, unreadCount, assessment] = await Promise.all([
      AiInsight.countDocuments({ user: req.user._id, type: 'weakness', isDismissed: false }),
      AiInsight.countDocuments({ user: req.user._id, type: 'recommendation', isDismissed: false }),
      AiInsight.countDocuments({ user: req.user._id, type: 'milestone', isDismissed: false }),
      AiInsight.countDocuments({ user: req.user._id, isRead: false, isDismissed: false }),
      getSkillAssessment(req.user._id).catch(() => null)
    ]);

    res.json({
      success: true,
      summary: {
        weaknesses,
        recommendations,
        milestones,
        unreadCount,
        overallScore: assessment?.overall?.score || null,
        overallLabel: assessment?.overall?.label || 'No data',
        overallColor: assessment?.overall?.color || '#94a3b8'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get summary', error: error.message });
  }
};
