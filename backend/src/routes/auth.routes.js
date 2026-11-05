import express from 'express';
import { 
  registerUser, 
  loginUser, 
  requestOTP, 
  verifyOTPAndLogin,
  googleLogin,
  checkReviewEligibility
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/security.middleware.js';

const router = express.Router();

// Apply anti-brute-force limiter to authentication endpoints
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleLogin);
router.post('/otp/request', authLimiter, requestOTP);
router.post('/otp/verify', authLimiter, verifyOTPAndLogin);

// Review eligibility check
router.get('/review-eligibility/:propertyId', protect, checkReviewEligibility);

export default router;
