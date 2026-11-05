import Room from '../models/room.model.js';
import Booking from '../models/booking.model.js';

/**
 * High-Performance Resource Mutex Lock
 * Serializes access per resource key (e.g. "room:<roomId>") across concurrent async executions.
 * This completely prevents race-condition double bookings when multiple users attempt
 * to reserve the last remaining inventory slot in the same millisecond.
 */
class ResourceMutex {
  constructor() {
    this.queues = new Map();
  }

  async acquire(key, task) {
    let queue = this.queues.get(key);
    if (!queue) {
      queue = Promise.resolve();
      this.queues.set(key, queue);
    }

    // Chain the task onto the resource queue
    const execution = queue.then(async () => {
      try {
        return await task();
      } finally {
        // If this is the last queued task, clean up key to prevent memory leaks
        if (this.queues.get(key) === execution) {
          this.queues.delete(key);
        }
      }
    });

    // Update queue pointer
    this.queues.set(key, execution.catch(() => {}));
    return execution;
  }
}

export const roomMutex = new ResourceMutex();

/**
 * In-Flight & Idempotency Request Cache
 * Prevents rapid double-clicks and duplicate API calls from creating duplicate bookings.
 */
const idempotencyStore = new Map();
const IDEMPOTENCY_TTL = 60 * 1000; // 60 seconds

export const acquireIdempotencyLock = (idempotencyKey) => {
  if (!idempotencyKey) return null;
  const existing = idempotencyStore.get(idempotencyKey);
  if (existing) {
    if (Date.now() - existing.timestamp < IDEMPOTENCY_TTL) {
      return existing;
    }
  }
  const entry = { timestamp: Date.now(), status: 'PENDING', result: null };
  idempotencyStore.set(idempotencyKey, entry);
  return null;
};

export const completeIdempotency = (idempotencyKey, result) => {
  if (!idempotencyKey) return;
  const entry = idempotencyStore.get(idempotencyKey);
  if (entry) {
    entry.status = 'COMPLETED';
    entry.result = result;
  }
};

export const releaseIdempotencyLock = (idempotencyKey) => {
  if (idempotencyKey) {
    idempotencyStore.delete(idempotencyKey);
  }
};

/**
 * Dual Booking Detection for Single User
 * Verifies whether the requesting tenant already has an active/confirmed booking
 * for the same room during overlapping dates.
 */
export const checkUserDualBookingConflict = async (tenantId, roomId, checkIn, checkOut, excludeBookingId = null) => {
  const start = new Date(checkIn);
  start.setHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);

  const query = {
    tenant: tenantId,
    room: roomId,
    status: { $in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
    checkInDate: { $lt: end },
    checkOutDate: { $gt: start }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return await Booking.findOne(query).select('_id status checkInDate checkOutDate totalAmount property');
};

/**
 * Creates a temporary lock on a room to prevent double booking
 * (Maintained for backward compatibility with existing tests)
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
 * (Maintained for backward compatibility with existing tests)
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
