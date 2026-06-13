const { paginate } = require('../utils/pagination');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { getCache, setCache, clearCache } = require('../utils/cache');

// @desc    Create new slot (Coach only)
// @route   POST /api/slots
// @access  Private (Coach)
exports.createSlot = async (req, res) => {
  try {
    const { startTime, endTime, duration, price, meetingLink, meetingPlatform, notes, capacity } = req.body;

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
      capacity: capacity || 1,
      status: 'available',
      isBooked: false
    });

    const populatedSlot = await Slot.findById(slot._id).populate(
      'coach',
      'name email chessRating title'
    );

    clearCache('available_slots');

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
  try {
    const { coachId, status = 'available' } = req.query;
    
    let query = { status };
    if (coachId) {
      query.coach = coachId;
    }

    // Only cache if no specific coach is requested
    if (!coachId && status === 'available') {
      const cached = getCache('available_slots');
      if (cached) return res.json(cached);
    }

    const slots = await Slot.find(query)
      .populate('coach', 'name email chessRating title hourlyRate');

    // Add remaining spots info to each slot
    const enrichedSlots = slots.map(s => ({
      ...s.toObject(),
      remainingSpots: Math.max(0, (s.capacity || 1) - (s.currentBookings || 0))
    }));

    if (!coachId && status === 'available') {
      setCache('available_slots', { success: true, slots: enrichedSlots });
    }

    res.json({ success: true, slots: enrichedSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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

    const enrichedSlots = slots.map(s => ({
      ...s.toObject(),
      remainingSpots: Math.max(0, (s.capacity || 1) - (s.currentBookings || 0))
    }));

    res.status(200).json({
      success: true,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
      slots: enrichedSlots
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

    if (slot.isBooked || slot.currentBookings > 0) {
      return res.status(400).json({ message: 'Cannot update a slot with active bookings' });
    }

    const allowedUpdates = [
      'startTime',
      'endTime',
      'duration',
      'price',
      'meetingLink',
      'meetingPlatform',
      'notes',
      'capacity'
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

    if (slot.isBooked || slot.currentBookings > 0) {
      return res.status(400).json({ message: 'Cannot delete a slot with active bookings' });
    }

    await slot.deleteOne();

    res.status(200).json({ success: true, message: 'Slot deleted' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ================================================================
// 🔥 DAILY CLASS CREATION - MANUAL SLOT CREATION FOR COACHES
// ================================================================

/**
 * @desc    Create daily slots for a coach manually
 * @route   POST /api/slots/daily/create
 * @access  Private (Coach)
 * @example POST /api/slots/daily/create { date: "2026-06-05", selectedSlots: [...] }
 */
exports.createDailySlots = async (req, res) => {
  try {
    const { date, selectedSlots, meetingLink, meetingPlatform, fee } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    if (!meetingLink) {
      return res.status(400).json({
        success: false,
        message: 'Meeting link is required'
      });
    }

    const dailyClassCreation = require('../utils/dailyClassCreation');
    const result = await dailyClassCreation.createDailySlots(
      req.user.id,
      date,
      selectedSlots,
      meetingLink,
      meetingPlatform,
      fee
    );

    if (result.success) {
      clearCache('available_slots');
      return res.status(201).json({
        success: true,
        message: result.message,
        date: result.date,
        slotsCreated: result.slotsCreated,
        slots: result.slots
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Daily slots creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create slots for multiple consecutive days
 * @route   POST /api/slots/daily/bulk
 * @access  Private (Coach)
 * @example POST /api/slots/daily/bulk { startDate: "2026-06-05", numberOfDays: 7 }
 */
exports.createBulkDailySlots = async (req, res) => {
  try {
    const { startDate, numberOfDays, selectedSlots, meetingLink, meetingPlatform, fee } = req.body;

    if (!startDate || !numberOfDays) {
      return res.status(400).json({
        success: false,
        message: 'startDate and numberOfDays are required'
      });
    }

    if (!meetingLink) {
      return res.status(400).json({
        success: false,
        message: 'Meeting link is required'
      });
    }

    const dailyClassCreation = require('../utils/dailyClassCreation');
    const result = await dailyClassCreation.createBulkDailySlots(
      req.user.id,
      startDate,
      numberOfDays,
      selectedSlots,
      meetingLink,
      meetingPlatform,
      fee
    );

    if (result.success) {
      clearCache('available_slots');
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Bulk daily slots creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create a custom time slot
 * @route   POST /api/slots/daily/custom
 * @access  Private (Coach)
 * @example POST /api/slots/daily/custom { date: "2026-06-05", time: "14:30", duration: 60 }
 */
exports.createCustomSlot = async (req, res) => {
  try {
    const { date, time, duration } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required (time format: HH:MM)'
      });
    }

    const dailyClassCreation = require('../utils/dailyClassCreation');
    const result = await dailyClassCreation.createCustomSlot(
      req.user.id,
      date,
      time,
      duration || 60
    );

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Custom slot creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all slots for a specific date
 * @route   GET /api/slots/daily/:date
 * @access  Private (Coach)
 */
exports.getDailySlotsForDate = async (req, res) => {
  try {
    const { date } = req.params;

    const dailyClassCreation = require('../utils/dailyClassCreation');
    const result = await dailyClassCreation.getCoachSlotsForDate(
      req.user.id,
      date
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Get daily slots error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete all slots for a specific date
 * @route   DELETE /api/slots/daily/:date
 * @access  Private (Coach)
 */
exports.deleteDailySlots = async (req, res) => {
  try {
    const { date } = req.params;

    const dailyClassCreation = require('../utils/dailyClassCreation');
    const result = await dailyClassCreation.deleteDailySlots(
      req.user.id,
      date
    );

    clearCache('available_slots');

    res.status(200).json(result);
  } catch (error) {
    console.error('Delete daily slots error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get predefined time slot templates
 * @route   GET /api/slots/predefined/list
 * @access  Public
 * @example GET /api/slots/predefined/list
 */
exports.getPredefinedSlots = (req, res) => {
  try {
    const dailyClassCreation = require('../utils/dailyClassCreation');
    const slots = dailyClassCreation.getPredefinedSlots();
    
    res.status(200).json({
      success: true,
      message: 'Predefined time slots template',
      totalSlots: slots.length,
      description: 'These are standard time slots coaches can use for daily class creation',
      slots
    });
  } catch (error) {
    console.error('Get predefined slots error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};