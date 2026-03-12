import express from 'express';
import { 
  createProperty, 
  addRoomToProperty, 
  searchProperties 
} from '../controllers/property.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /properties/search:
 * get:
 * summary: Search for properties
 * tags: [Properties]
 * parameters:
 * - in: query
 * name: category
 * schema:
 * type: string
 * description: PG, Hostel, Motel, or Hotel
 * responses:
 * 200:
 * description: List of properties
 */
// Public routes
router.get('/search', searchProperties);

// Protected routes (Owners/Admins/Company)
router.post('/', protect, authorize('OWNER', 'COMPANY_ADMIN', 'ADMIN'), createProperty);
router.post('/:propertyId/rooms', protect, authorize('OWNER', 'COMPANY_MANAGER'), addRoomToProperty);

export default router;