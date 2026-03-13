import express from 'express';
import { 
  createProperty, 
  addRoomToProperty, 
  searchProperties 
} from '../controllers/property.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();


router.get('/search', searchProperties);


router.post('/', protect, authorize('OWNER', 'COMPANY_ADMIN', 'ADMIN'), createProperty);

router.post('/:propertyId/rooms', protect, authorize('OWNER', 'COMPANY_MANAGER'), addRoomToProperty);

export default router;