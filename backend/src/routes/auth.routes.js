import express from 'express';
import { 
  registerUser, 
  loginUser, 
  requestOTP, 
  verifyOTPAndLogin,
  googleLogin,
  facebookLogin,
  checkReviewEligibility
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/otp/request', requestOTP);
router.post('/otp/verify', verifyOTPAndLogin);
router.get('/review-eligibility/:propertyId', protect, checkReviewEligibility);

export default router;
