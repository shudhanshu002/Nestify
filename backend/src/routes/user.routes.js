import express from 'express';
import { getUserProfile, updateKYC } from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { toggleWishlist, getMyWishlist } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/kyc', protect, updateKYC);

// wishlist
router.post('/wishlist', protect, toggleWishlist);
router.get('/wishlist', protect, getMyWishlist);

export default router;