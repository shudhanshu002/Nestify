import express from 'express';
import { 
  getUserProfile, 
  updateKYC, 
  submitKYC,
  toggleWishlist, 
  getMyWishlist, 
  getKYCQueue,
  verifyUser,
  getOwnerDeal,
  selectOwnerDeal,
  switchRole
} from '../controllers/user.controller.js';
import { isAdmin, protect } from '../middlewares/auth.middleware.js';
import { uploadKYC } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/kyc', protect, updateKYC);
router.patch('/switch-role', protect, switchRole);
router.post('/switch-role', protect, switchRole);

// Commercial Agreement / Deal routes for Owners
router.get('/deal', protect, getOwnerDeal);
router.post('/deal/select', protect, selectOwnerDeal);

// KYC upload routes (support both /submit-kyc and /kyc-upload)
router.post('/submit-kyc', protect, uploadKYC.single('document'), submitKYC);
router.post('/kyc-upload', protect, uploadKYC.single('document'), submitKYC);

// Wishlist
router.post('/wishlist', protect, toggleWishlist);
router.get('/wishlist', protect, getMyWishlist);

// Admin KYC verification routes
router.get('/admin/kyc-queue', protect, isAdmin, getKYCQueue);
router.put('/admin/verify/:id', protect, isAdmin, verifyUser);

export default router;
