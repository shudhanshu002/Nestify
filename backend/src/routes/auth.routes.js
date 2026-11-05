import express from 'express';
import { 
  registerUser, 
  sendRegisterOTP,
  loginUser, 
  requestOTP, 
  verifyOTPAndLogin,
  googleLogin,
  checkReviewEligibility,
  sendVerifyEmailOTP,
  verifyEmail,
  forgotPasswordRequest,
  forgotPasswordReset
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/security.middleware.js';

const router = express.Router();

// Apply anti-brute-force limiter to authentication endpoints
router.post('/send-register-otp', authLimiter, sendRegisterOTP);
router.post('/resend-register-otp', authLimiter, sendRegisterOTP);
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleLogin);
router.post('/otp/request', authLimiter, requestOTP);
router.post('/otp/verify', authLimiter, verifyOTPAndLogin);

// Forgot Password Flow
router.post('/forgot-password/request', authLimiter, forgotPasswordRequest);
router.post('/forgot-password/resend', authLimiter, forgotPasswordRequest);
router.post('/forgot-password/reset', authLimiter, forgotPasswordReset);

// Existing account email verification
router.post('/send-verify-email-otp', protect, authLimiter, sendVerifyEmailOTP);
router.post('/verify-email', protect, authLimiter, verifyEmail);

// Review eligibility check
router.get('/review-eligibility/:propertyId', protect, checkReviewEligibility);

export default router;
