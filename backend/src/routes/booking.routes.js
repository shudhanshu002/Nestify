import express from 'express';
import { initiateBooking, getMyBookings } from '../controllers/booking.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // All booking routes are private

router.post('/initiate', initiateBooking);
router.get('/my-bookings', getMyBookings);

export default router;