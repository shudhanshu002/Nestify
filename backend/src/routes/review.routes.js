import express from 'express';
import { addReview, getPropertyReviews, updateReview } from '../controllers/review.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { interactionLimiter } from '../middlewares/security.middleware.js';

const router = express.Router();

// PUBLIC: Anyone can see reviews
router.get('/:propertyId', getPropertyReviews);

// PROTECTED: Only verified tenants can post/edit (Rate limited against spam)
router.post('/:propertyId', protect, interactionLimiter, upload.array('images', 3), addReview);
router.patch('/:reviewId', protect, interactionLimiter, updateReview);

export default router;
