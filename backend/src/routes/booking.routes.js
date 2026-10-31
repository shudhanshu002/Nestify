import express from 'express';
import { 
  initiateBooking, 
  getMyBookings, 
  createBooking, 
  getOwnerBookings, 
  updateBookingStatus,
  getBookingReceipt 
} from '../controllers/booking.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); 

router.post('/', createBooking); 
router.post('/initiate', initiateBooking);
router.get('/my-bookings', getMyBookings);
router.get('/owner-bookings', getOwnerBookings);
router.patch('/:id/status', updateBookingStatus);
router.get('/:id/receipt', getBookingReceipt);

export default router;
