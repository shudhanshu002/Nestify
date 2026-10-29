import express from 'express';
import { 
  createProperty, 
  addRoomToProperty, 
  searchProperties,
  getMyProperties,
  getPropertyById, // 󾠮 Import it here
  getAdminPendingProperties,
  verifyProperty,
  resubmitPropertyDocs
} from '../controllers/property.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/search', searchProperties);

// --- ADMIN ROUTES (Must be above /:id) ---
// 󾠰 Added these specific routes for the Matrix Dashboard
router.get('/admin/pending', protect, authorize('ADMIN'), getAdminPendingProperties);
router.put('/admin/verify/:id', protect, authorize('ADMIN'), verifyProperty);

// Protected routes
router.get('/my-listings', protect, authorize('OWNER', 'ADMIN'), getMyProperties);
// router.post('/', protect, authorize('OWNER', 'ADMIN'),upload.array('images', 5), createProperty);
router.post('/', protect, upload.fields([
  { name: 'images', maxCount: 10 },        // For building photos
  { name: 'legalDocument', maxCount: 1 }   // For ownership proof
]), createProperty);
// 󾠯 ADD THIS LINE (Keep it below /search)
router.get('/:id', getPropertyById); 
router.post('/:propertyId/rooms', protect, authorize('OWNER'),upload.array('images', 4), addRoomToProperty);

// Add this line with your other property routes
router.put('/:id/resubmit', protect, upload.fields([{ name: 'legalDocument', maxCount: 1 }]), resubmitPropertyDocs);

export default router;