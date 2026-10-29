import express from 'express';
import { 
  getUserProfile, 
  updateKYC, 
  submitKYC, // 󾠮 Make sure this is imported
  toggleWishlist, 
  getMyWishlist, 
  getKYCQueue,
  verifyUser
} from '../controllers/user.controller.js';
import { isAdmin, protect } from '../middlewares/auth.middleware.js';
import { uploadKYC } from '../middlewares/upload.middleware.js';
import User from '../models/user.model.js';


const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/kyc', protect, updateKYC);

// KYC upload routes (support both /submit-kyc and /kyc-upload)
router.post('/submit-kyc', protect, uploadKYC.single('document'), submitKYC);
router.post('/kyc-upload', protect, uploadKYC.single('document'), submitKYC);

// Wishlist
router.post('/wishlist', protect, toggleWishlist);
router.get('/wishlist', protect, getMyWishlist);

// Add these to your user routes
// Only Admins can access these
router.get('/admin/kyc-queue', protect, isAdmin, getKYCQueue);
router.put('/admin/verify/:id', protect, isAdmin, verifyUser);

export default router;