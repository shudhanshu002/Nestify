import Booking from '../models/booking.model.js';
import Room from '../models/room.model.js';
import Property from '../models/property.model.js';

/**
 * 󾠮 REFINED UTILITY: Dynamic Inventory Matrix
 * We must ensure we check against 'totalInventory' correctly.
 */
const getAvailableCountForDates = async (roomId, checkIn, checkOut, totalInventory) => {
  // 󾠯 CRITICAL: Standardize dates to "Start of Day" to avoid 11:59 PM vs 12:01 AM issues
  const start = new Date(checkIn);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(checkOut);
  end.setHours(23, 59, 59, 999);

  const overlappingBookings = await Booking.countDocuments({
    room: roomId,
    status: { $in: ['CONFIRMED', 'CHECKED_IN'] },
    $and: [
      { checkInDate: { $lt: end } },  // Existing stay starts before your checkout
      { checkOutDate: { $gt: start } } // Existing stay ends after your checkin
    ]
  });

  // Example: totalInventory: 1, overlapping: 1 => 0 available (Correctly Blocks!)
  const available = totalInventory - overlappingBookings;
  return available > 0 ? available : 0;
};

// @desc    Check availability for specific dates
// @route   POST /api/v1/bookings/initiate
export const initiateBooking = async (req, res, next) => {
  try {
    const { roomId, checkInDate, checkOutDate } = req.body;
    const room = await Room.findById(roomId);

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const availableUnits = await getAvailableCountForDates(
      roomId, 
      checkInDate, 
      checkOutDate, 
      room.totalInventory
    );

    if (availableUnits <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This room is sold out for the selected dates.' 
      });
    }

    res.status(200).json({
      success: true,
      availableUnits
    });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { property, room, checkInDate, checkOutDate, totalAmount } = req.body;

    // 󾠰 1. Get the current Room Data
    const roomDoc = await Room.findById(room).populate('property');
    if (!roomDoc) return res.status(404).json({ success: false, message: "Room not found" });

    // 󾠱 2. RE-VERIFY MATRIX: Use our bulletproof logic
    // We pass roomDoc.totalInventory (e.g., 1)
    const availableUnits = await getAvailableCountForDates(
      room, 
      checkInDate, 
      checkOutDate, 
      roomDoc.totalInventory
    );

    // 󾠲 3. THE BLOCKER: If units <= 0, someone else occupied the "slot" in the timeline
    if (availableUnits <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Sold Out! All ${roomDoc.totalInventory} units of this type are booked for these dates.` 
      });
    }

    // 4. Create the Booking
    const booking = await Booking.create({
      tenant: req.user._id,
      property,
      room,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      totalAmount,
      status: 'CONFIRMED',
      paymentStatus: 'PAID'
    });

    // 󾠳 5. UPDATE SNAPSHOT (Optional)
    // We update the field just for a 'quick look' on the dashboard, 
    // but our logic above is what actually protects the calendar.
    roomDoc.availableInventory = availableUnits - 1;
    await roomDoc.save();

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error("OVERLAP_PROTECTION_FAILED:", error);
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ tenant: req.user._id })
      .populate({
        path: 'property', // 1. Populate the property first
        select: 'title owner images',
        populate: { 
          path: 'owner', // 2. Then populate the owner INSIDE the property
          select: '_id firstName lastName role' 
        }
      })
      .sort('-createdAt');

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for properties owned by the logged-in user
// @route   GET /api/v1/bookings/owner-bookings
export const getOwnerBookings = async (req, res, next) => {
  try {
    // 1. Find all property IDs belonging to this owner
    const properties = await Property.find({ owner: req.user._id }).select('_id');
    const propertyIds = properties.map(p => p._id);

    // 2. Find all bookings for these properties
    const bookings = await Booking.find({ property: { $in: propertyIds } })
      .populate('property', 'title location')
      .populate('room', 'roomType basePrice')
      .populate('tenant', 'firstName lastName email avatar')
      .sort('-checkInDate'); // Show upcoming/current stays first

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Booking Status (Check-in / Check-out / Cancel)
// @route   PATCH /api/v1/bookings/:id/status
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, actualDate } = req.body; 
    const booking = await Booking.findById(req.params.id).populate('property');

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // 1. SECURITY: Owner check
    if (booking.property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const now = new Date();
    const selectedDate = new Date(actualDate || now);

    // 2. 󾠮 LOGIC: Prevent Check-in if the date is too far ahead
    if (status === 'CHECKED_IN') {
      const hoursUntilCheckIn = (new Date(booking.checkInDate) - now) / (1000 * 60 * 60);
      
      // If the guest is trying to check in more than 24 hours early
      if (hoursUntilCheckIn > 24) {
        return res.status(400).json({ 
          success: false, 
          message: `Too Early! Check-in is only allowed within 24 hours of the scheduled date (${new Date(booking.checkInDate).toLocaleDateString()}).` 
        });
      }
      booking.actualCheckInDate = selectedDate;
    }

    // 3. 󾠯 LOGIC: Record Actual Check-out
    if (status === 'COMPLETED') {
      booking.actualCheckOutDate = selectedDate;
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({ success: true, message: `Guest ${status} successfully.`, data: booking });
  } catch (error) { next(error); }
};

