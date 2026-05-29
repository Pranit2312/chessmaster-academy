const { paginate } = require('../utils/pagination');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { getCache, setCache } = require('../utils/cache');

// @desc    Create new slot (Coach only)
// @route   POST /api/slots
// @access  Private (Coach)
exports.createSlot = async (req, res) => {
  try {
    const { startTime, endTime, duration, price, meetingLink, meetingPlatform, notes } = req.body;

    // 🔍 LOG incoming data for debugging
    console.log("Incoming slot create request:", {
      startTime,
      endTime,
      duration,
      price,
      meetingPlatform,
      coach: req.user.id
    });

    // Validate coach
    const coach = await User.findById(req.user.id);
    if (!coach || coach.role !== 'coach') {
      return res.status(403).json({ message: 'Only coaches can create slots' });
    }

    // ⛔ Prevent creating slots in the past
    if (new Date(startTime) <= new Date()) {
      return res.status(400).json({ message: 'Cannot create slot in the past' });
    }

    // Check if slot overlaps with existing slots
    const overlappingSlot = await Slot.findOne({
      coach: req.user.id,
      status: { $in: ['available', 'booked'] },
      $or: [
        {
          startTime: { $lt: new Date(endTime), $gte: new Date(startTime) }
        },
        {
          endTime: { $gt: new Date(startTime), $lte: new Date(endTime) }
        },
        {
          startTime: { $lte: new Date(startTime) },
          endTime: { $gte: new Date(endTime) }
        }
      ]
    });

    if (overlappingSlot) {
      console.log("❌ Overlapping slot found:", overlappingSlot);
      return res.status(400).json({ message: 'Slot overlaps with existing slot' });
    }

    // ✅ Create slot
    const slot = await Slot.create({
      coach: req.user.id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: duration || 60,
      price,
      meetingLink,
      meetingPlatform: meetingPlatform || 'Zoom',
      notes,
      status: 'available',
      isBooked: false
    });

    const populatedSlot = await Slot.findById(slot._id).populate(
      'coach',
      'name email chessRating title'
    );

    res.status(201).json({
      success: true,
      slot: populatedSlot
    });

  } catch (error) {
    console.error('Create Slot Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all available slots
// @route   GET /api/slots
// @access  Public
// @desc    Get all available slots
// @route   GET /api/slots
// @access  Public
exports.getSlots = async (req, res) => {
  const cached = getCache('available_slots');
  if (cached) return res.json(cached);

  const slots = await Slot.find({ status: 'available' })
    .populate('coach', 'name email chessRating title hourlyRate');

  setCache('available_slots', { success: true, slots });

  res.json({ success: true, slots });
};

// @desc    Get coach's own slots
// @route   GET /api/slots/my-slots
// @access  Private (Coach)
exports.getMySlots = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip } = paginate(page, limit);

    const query = {
      coach: req.user.id,
      status: { $in: ['available', 'booked'] }
    };

    const slots = await Slot.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ startTime: 1 });

    const total = await Slot.countDocuments(query);

    res.status(200).json({
      success: true,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
      slots
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update slot
// @route   PUT /api/slots/:id
// @access  Private (Coach)
exports.updateSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (slot.coach.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this slot' });
    }

    if (slot.isBooked) {
      return res.status(400).json({ message: 'Cannot update booked slot' });
    }

    const allowedUpdates = [
      'startTime',
      'endTime',
      'duration',
      'price',
      'meetingLink',
      'meetingPlatform',
      'notes'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        slot[field] = req.body[field];
      }
    });

    await slot.save();

    res.status(200).json({ success: true, slot });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete slot
// @route   DELETE /api/slots/:id
// @access  Private (Coach)
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (slot.coach.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this slot' });
    }

    if (slot.isBooked) {
      return res.status(400).json({ message: 'Cannot delete booked slot' });
    }

    await slot.deleteOne();

    res.status(200).json({ success: true, message: 'Slot deleted' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};