import express from 'express';
import { 
  initiateBooking, 
  getMyBookings, 
  createBooking, 
  getOwnerBookings, 
  getOwnerOccupancyMatrix,
  updateBookingStatus,
  getBookingReceipt,
  checkExtensionAvailability,
  extendStay
} from '../controllers/booking.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); 

router.post('/', createBooking); 
router.post('/initiate', initiateBooking);
router.get('/my-bookings', getMyBookings);
router.get('/owner-bookings', getOwnerBookings);
router.get('/owner-occupancy', getOwnerOccupancyMatrix);
router.patch('/:id/status', updateBookingStatus);
router.get('/:id/receipt', getBookingReceipt);

// Stay Extension Endpoints (Active / Confirmed Stays)
// Supports both GET/POST and /check-extend /check-extension aliases
router.get('/:id/check-extend', checkExtensionAvailability);
router.post('/:id/check-extend', checkExtensionAvailability);
router.get('/:id/check-extension', checkExtensionAvailability);
router.post('/:id/check-extension', checkExtensionAvailability);
router.post('/:id/extend', extendStay);

export default router;
