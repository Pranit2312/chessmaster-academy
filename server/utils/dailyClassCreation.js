/**
 * Daily Class Creation Utility
 * Allows coaches to manually create daily available slots
 */

const Slot = require('../models/Slot');
const User = require('../models/User');

/**
 * Predefined time slots for coaching sessions
 */
const PREDEFINED_SLOTS = [
  { time: '09:00', duration: 60, label: '9:00 AM - 10:00 AM' },
  { time: '10:00', duration: 60, label: '10:00 AM - 11:00 AM' },
  { time: '11:00', duration: 60, label: '11:00 AM - 12:00 PM' },
  { time: '12:00', duration: 60, label: '12:00 PM - 1:00 PM' },
  { time: '13:00', duration: 60, label: '1:00 PM - 2:00 PM' },
  { time: '14:00', duration: 60, label: '2:00 PM - 3:00 PM' },
  { time: '15:00', duration: 60, label: '3:00 PM - 4:00 PM' },
  { time: '16:00', duration: 60, label: '4:00 PM - 5:00 PM' },
  { time: '17:00', duration: 60, label: '5:00 PM - 6:00 PM' },
  { time: '18:00', duration: 60, label: '6:00 PM - 7:00 PM' },
  { time: '19:00', duration: 60, label: '7:00 PM - 8:00 PM' },
  { time: '20:00', duration: 60, label: '8:00 PM - 9:00 PM' }
];

/**
 * Create daily slots for a coach
 * @param {String} coachId - Coach ID
 * @param {Date} date - Date for slot creation
 * @param {Array} selectedSlots - Selected time slots (default: all)
 * @param {String} meetingLink - Meeting link for the slots
 * @param {String} meetingPlatform - Meeting platform (Zoom, Google Meet, etc.)
 * @param {Number} fee - The fee for the slot
 * @returns {Object} - Created slots info
 */
exports.createDailySlots = async (coachId, date, selectedSlots = null, meetingLink = null, meetingPlatform = 'Zoom', fee = null) => {
  try {
    // Verify coach exists and is a coach
    const coach = await User.findById(coachId);
    if (!coach) {
      throw new Error('Coach not found');
    }
    if (coach.role !== 'coach' && coach.role !== 'admin') {
      throw new Error('Only coaches can create slots');
    }

    if (!meetingLink) {
      throw new Error('Meeting link is required for creating slots');
    }

    // Set date to start of day
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    // Check if slots already exist for this date range
    // We check by looking at startTime within that day
    const startOfDay = new Date(slotDate);
    const endOfDay = new Date(slotDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingCount = await Slot.countDocuments({
      coach: coachId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingCount > 0) {
      throw new Error('Slots already exist for this date. Please delete or modify existing slots.');
    }

    // Determine which slots to create
    const slotsToCreate = selectedSlots || PREDEFINED_SLOTS;

    // Create slots for each selected time
    const createdSlots = [];
    for (const slot of slotsToCreate) {
      const [hours, minutes] = slot.time.split(':');
      const slotStartTime = new Date(slotDate);
      slotStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const slotEndTime = new Date(slotStartTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + (slot.duration || 60));

      const newSlot = await Slot.create({
        coach: coachId,
        startTime: slotStartTime,
        endTime: slotEndTime,
        duration: slot.duration || 60,
        price: fee !== null && fee !== '' ? Number(fee) : (coach.hourlyRate || 0),
        meetingLink,
        meetingPlatform,
        capacity: slot.capacity || 1,
        status: 'available',
        isBooked: false
      });

      // Add to coach's slots array
      coach.slots.push(newSlot._id);

      createdSlots.push({
        _id: newSlot._id,
        time: slot.label || `${slot.time}`,
        duration: slot.duration || 60,
        status: 'available'
      });
    }

    // Save coach with updated slots
    await coach.save();

    return {
      success: true,
      message: `Created ${createdSlots.length} slots for ${slotDate.toDateString()}`,
      date: slotDate,
      slotsCreated: createdSlots.length,
      slots: createdSlots
    };
  } catch (error) {
    console.error('createDailySlots error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get predefined time slots
 */
exports.getPredefinedSlots = () => {
  return PREDEFINED_SLOTS;
};

/**
 * Get slots for a coach on a specific date
 */
exports.getCoachSlotsForDate = async (coachId, date) => {
  try {
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(slotDate);
    const endOfDay = new Date(slotDate);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await Slot.find({
      coach: coachId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startTime: 1 });

    return {
      success: true,
      date: slotDate,
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.status === 'available').length,
      slots
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Delete slots for a coach on a specific date
 */
exports.deleteDailySlots = async (coachId, date) => {
  try {
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(slotDate);
    const endOfDay = new Date(slotDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find slots to delete (only unbooked ones with no active bookings)
    // NOTE: $ifNull handles old docs that predate the currentBookings field
    const slotsToDelete = await Slot.find({
      coach: coachId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      isBooked: false,
      $expr: { $eq: [{ $ifNull: ['$currentBookings', 0] }, 0] }
    });

    const slotIds = slotsToDelete.map(s => s._id);

    // Delete from Slot collection
    const result = await Slot.deleteMany({
      _id: { $in: slotIds }
    });

    // Remove from User.slots array
    await User.findByIdAndUpdate(coachId, {
      $pull: { slots: { $in: slotIds } }
    });

    return {
      success: true,
      message: `Deleted ${result.deletedCount} slots`,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Bulk create slots for multiple days
 */
exports.createBulkDailySlots = async (coachId, startDate, numberOfDays, selectedSlots = null, meetingLink = null, meetingPlatform = 'Zoom', fee = null) => {
  try {
    const results = [];

    for (let i = 0; i < numberOfDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const result = await exports.createDailySlots(coachId, date, selectedSlots, meetingLink, meetingPlatform, fee);
      results.push(result);
    }

    const successfulDays = results.filter(r => r.success).length;
    
    return {
      success: successfulDays > 0,
      message: successfulDays > 0 ? `Created slots for ${successfulDays} days` : results[0].message,
      daysCreated: successfulDays,
      results
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};
