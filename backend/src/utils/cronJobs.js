import cron from 'node-cron';
import Booking from '../models/booking.model.js';
import Room from '../models/room.model.js';

// Runs every night at midnight
cron.schedule('0 0 * * *', async () => {
  const today = new Date();
  
  // 1. Find all bookings that ended yesterday
  const expiredBookings = await Booking.find({ 
    checkOutDate: { $lt: today }, 
    status: 'CONFIRMED' 
  });

  for (let booking of expiredBookings) {
    // 2. Increase the room inventory back
    await Room.findByIdAndUpdate(booking.room, { 
      $inc: { availableInventory: 1 } 
    });

    // 3. Complete the booking status
    booking.status = 'COMPLETED';
    await booking.save();
    
    console.log(`✅ Inventory restored for Room Type: ${booking.room}`);
  }
});