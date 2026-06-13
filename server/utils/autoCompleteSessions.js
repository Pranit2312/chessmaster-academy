const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const logger = require('./logger');

module.exports = async () => {
  try {
    const now = new Date();

    // Find slots whose endTime has passed but are still booked
    const expiredSlots = await Slot.find({
      endTime: { $lt: now },
      status: { $in: ['booked', 'available'] }
    });

    if (expiredSlots.length === 0) return;

    // Parallelize slot saves and booking updates
    await Promise.all(expiredSlots.map(async (slot) => {
      slot.status = 'expired';
      slot.isBooked = false;
      await slot.save();

      if (slot.bookingId) {
        await Booking.findByIdAndUpdate(slot.bookingId, {
          sessionStatus: 'expired'
        });
      }
    }));

    logger.info(`Auto-expired ${expiredSlots.length} slots`);
  } catch (err) {
    logger.error('AutoComplete Error:', err.message);
  }
};