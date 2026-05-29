const Slot = require('../models/Slot');
const Booking = require('../models/Booking');

module.exports = async () => {
  try {
    const now = new Date();

    // Find slots whose endTime has passed but are still booked
    const expiredSlots = await Slot.find({
      endTime: { $lt: now },
      status: { $in: ['booked', 'available'] }
    });

    for (let slot of expiredSlots) {
      slot.status = 'expired';
      slot.isBooked = false;
      await slot.save();

      // Update booking if exists
      if (slot.bookingId) {
        await Booking.findByIdAndUpdate(slot.bookingId, {
          sessionStatus: 'expired'
        });
      }
    }

    console.log(`⏱ Auto-expired ${expiredSlots.length} slots`);
  } catch (err) {
    console.error('AutoComplete Error:', err.message);
  }
};