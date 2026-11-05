import express from 'express';
import { 
  createProperty, 
  addRoomToProperty, 
  searchProperties,
  getMyProperties,
  getPropertyById,
  getAdminPendingProperties,
  verifyProperty,
  resubmitPropertyDocs,
  updatePropertyTier
} from '../controllers/property.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { uploadLimiter, searchLimiter } from '../middlewares/security.middleware.js';

const router = express.Router();

// Public routes with search rate limiting (Anti-scraping)
router.get('/search', searchLimiter, searchProperties);

// --- ADMIN ROUTES (Must be above /:id) ---
router.get('/admin/pending', protect, authorize('ADMIN'), getAdminPendingProperties);
router.put('/admin/verify/:id', protect, authorize('ADMIN'), verifyProperty);
router.patch('/admin/verify/:id', protect, authorize('ADMIN'), verifyProperty);
router.put('/verify/:id', protect, authorize('ADMIN'), verifyProperty);
router.patch('/verify/:id', protect, authorize('ADMIN'), verifyProperty);

// Protected routes
router.get('/my-listings', protect, authorize('OWNER', 'ADMIN'), getMyProperties);
router.post('/', protect, uploadLimiter, upload.fields([
  { name: 'images', maxCount: 10 },        // For building photos
  { name: 'legalDocument', maxCount: 1 }   // For ownership proof
]), createProperty);

router.get('/:id', getPropertyById); 
router.post('/:propertyId/rooms', protect, authorize('OWNER'), uploadLimiter, upload.array('images', 4), addRoomToProperty);
router.put('/:id/resubmit', protect, uploadLimiter, upload.fields([{ name: 'legalDocument', maxCount: 1 }]), resubmitPropertyDocs);
router.patch('/:id/tier', protect, updatePropertyTier);

export default router;
