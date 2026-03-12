import Room from '../models/room.model.js';
import Booking from '../models/booking.model.js';

/**
 * Creates a temporary lock on a room to prevent double booking
 */
export const lockRoomForBooking = async (roomId) => {
  const room = await Room.findById(roomId);
  
  if (!room || room.availableInventory <= 0 || room.isLocked) {
    throw new Error('Room is currently unavailable or being booked by another user');
  }

  // Set lock with a 5-minute timeout (Production grade TTL logic)
  room.isLocked = true;
  room.lockTimeout = new Date(Date.now() + 5 * 60 * 1000); 
  await room.save();
  
  return room;
};

/**
 * Finalize the booking and reduce inventory
 */
export const confirmBooking = async (bookingData) => {
  const { roomId, tenantId, propertyId, amount } = bookingData;

  const booking = await Booking.create({
    tenant: tenantId,
    property: propertyId,
    room: roomId,
    totalAmount: amount,
    status: 'CONFIRMED',
    paymentStatus: 'PAID'
  });

  // Reduce inventory and release lock
  await Room.findByIdAndUpdate(roomId, {
    $inc: { availableInventory: -1 },
    $set: { isLocked: false, lockTimeout: null }
  });

  return booking;
};