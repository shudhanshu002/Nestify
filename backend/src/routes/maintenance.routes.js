import express from 'express';
import { 
  createTicket, 
  getAdminTickets, 
  getMyTickets, 
  getOwnerTickets, 
  rateMaintenanceTicket, 
  respondToTicket 
} from '../controllers/maintenance.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { interactionLimiter } from '../middlewares/security.middleware.js';

const router = express.Router();

// All maintenance routes require login
router.use(protect);

router.post('/', interactionLimiter, createTicket);
router.get('/my-tickets', getMyTickets);
router.get('/my-tickets/:propertyId', getMyTickets);
router.patch('/:id/respond', respondToTicket);
router.get('/admin/all', getAdminTickets);
router.get('/owner/all', getOwnerTickets);
router.patch('/:id/rate', rateMaintenanceTicket);

export default router;
