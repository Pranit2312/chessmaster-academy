const User = require('../models/User');
const Slot = require('../models/Slot');

// @desc    Get all coaches
// @route   GET /api/users/coaches
// @access  Public
exports.getCoaches = async (req, res) => {
  try {
    const { search, minRating, maxRating, minPrice, maxPrice, specialization } = req.query;

    let query = { role: 'coach', isActive: true };

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Rating filters
    if (minRating) query.chessRating = { ...query.chessRating, $gte: Number(minRating) };
    if (maxRating) query.chessRating = { ...query.chessRating, $lte: Number(maxRating) };

    // Price filters (coach hourlyRate)
    if (minPrice) query.hourlyRate = { ...query.hourlyRate, $gte: Number(minPrice) };
    if (maxPrice) query.hourlyRate = { ...query.hourlyRate, $lte: Number(maxPrice) };

    // Specialization filter
    if (specialization) {
      query.specializations = { $in: [specialization] };
    }

    const coaches = await User.find(query)
      .select('-password')
      .sort({ averageRating: -1, totalSessions: -1 })
      .populate({
        path: "slots",
        select: "startTime endTime duration price status meetingPlatform notes",
        match: { status: { $ne: "deleted" } }  // do not return deleted slots
      });

    res.status(200).json({
      success: true,
      count: coaches.length,
      coaches
    });

  } catch (error) {
    console.error('Get Coaches Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single coach by ID
// @route   GET /api/users/coach/:id
// @access  Public
exports.getCoachById = async (req, res) => {
  try {
    const coach = await User.findOne({
      _id: req.params.id,
      role: 'coach'
    })
      .select('-password')
      .populate({
        path: "slots",
        select: "startTime endTime duration price status meetingPlatform notes",
        match: { status: { $ne: "deleted" } }
      });

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    res.status(200).json({ success: true, coach });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fields that can be updated
    const allowedUpdates = [
      'name', 'age', 'chessRating', 'ratingType', 'country', 'timezone',
      'bio', 'specializations', 'hourlyRate', 'title', 'skillLevel', 
      'learningGoals', 'profileImage'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      user: await User.findById(user._id).select('-password')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};