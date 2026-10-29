import express from 'express';
import { createTicket, getAdminTickets, getMyTickets, getOwnerTickets, rateMaintenanceTicket, respondToTicket } from '../controllers/maintenance.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All maintenance routes require login
router.use(protect);

// @route   POST /api/v1/maintenance
router.post('/', createTicket);
router.get('/my-tickets/:propertyId', getMyTickets);
router.patch('/:id/respond',  respondToTicket);
router.get('/admin/all',  getAdminTickets); // Add admin middleware here if you have it
router.get('/owner/all', getOwnerTickets);
router.patch('/:id/rate', protect, rateMaintenanceTicket);

export default router;