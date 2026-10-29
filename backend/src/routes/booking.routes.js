import express from 'express';
// 󾠯 IMPORT the new createBooking function
import { initiateBooking, getMyBookings, createBooking, getOwnerBookings, updateBookingStatus } from '../controllers/booking.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); 

// 󾠰 ADD THIS LINE (This maps to POST /api/v1/bookings)
router.post('/', createBooking); 

router.post('/initiate', initiateBooking);
router.get('/my-bookings', getMyBookings);
router.get('/owner-bookings', getOwnerBookings);
router.patch('/:id/status', updateBookingStatus);

export default router;