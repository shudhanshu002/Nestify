// Managing the booking lifecycle (Request -> Lock -> Confirm).

import * as bookingService from '../services/booking.service.js';

// @desc    Initiate a booking (Locks the room)
// @route   POST /api/v1/bookings/initiate
export const initiateBooking = async (req, res, next) => {
    try {
        const {roomId} = req.body;
        const room = await bookingService.lockRoomForBooking(roomId);

        res.status(200).json({
            message: 'Room locked for 5 minutes. Complete paymet to confirm.',
            room
        });
    } catch (error) {
        res.status(400);
        next(error);
    }
};


// @desc    Get user booking history
// @route   GET /api/v1/bookings/my-bookings
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ tenant: req.user._id })
      .populate('property', 'title location')
      .populate('room', 'roomType');
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};