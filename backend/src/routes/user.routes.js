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
  switchRole,
  sendPhoneOTP,
  sendWhatsAppOTPHandler,
  verifyPhoneOTP,
  verifyIdentity,
  verifySelfie,
  sendEmergencyContactOTPHandler,
  verifyEmergencyContactOTPHandler,
  submitStudentOrWork,
  sendWorkEmailOTP,
  verifyWorkEmailOTP,
  getUserVerificationSummary
} from '../controllers/user.controller.js';
import { isAdmin, protect } from '../middlewares/auth.middleware.js';
import { uploadKYC } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/kyc', protect, updateKYC);
router.patch('/switch-role', protect, switchRole);
router.post('/switch-role', protect, switchRole);

// ==========================================
// Comprehensive User Verification Endpoints
// ==========================================
router.get('/verification-status', protect, getUserVerificationSummary);

// 1. Phone Verification Routes (SMS & WhatsApp)
router.post('/send-phone-otp', protect, sendPhoneOTP);
router.post('/send-whatsapp-otp', protect, sendWhatsAppOTPHandler);
router.post('/verify-phone-otp', protect, verifyPhoneOTP);

// 2. Identity / Aadhaar Verification Routes
router.post('/verify-identity', protect, uploadKYC.single('document'), verifyIdentity);

// 3. Selfie & Liveness Verification Routes
router.post('/verify-selfie', protect, uploadKYC.single('selfie'), verifySelfie);

// 4. Emergency Contact Verification Routes
router.post('/emergency-contact/send-otp', protect, sendEmergencyContactOTPHandler);
router.post('/emergency-contact/verify-otp', protect, verifyEmergencyContactOTPHandler);

// 5. Student / Corporate Verification Routes
router.post('/student-work', protect, uploadKYC.single('idCard'), submitStudentOrWork);
router.post('/student-work/send-work-email-otp', protect, sendWorkEmailOTP);
router.post('/student-work/verify-work-email-otp', protect, verifyWorkEmailOTP);

// Commercial Agreement / Deal routes for Owners
router.get('/deal', protect, getOwnerDeal);
router.post('/deal/select', protect, selectOwnerDeal);

// Legacy KYC upload routes (support both /submit-kyc and /kyc-upload)
router.post('/submit-kyc', protect, uploadKYC.single('document'), submitKYC);
router.post('/kyc-upload', protect, uploadKYC.single('document'), submitKYC);

// Wishlist
router.post('/wishlist', protect, toggleWishlist);
router.get('/wishlist', protect, getMyWishlist);

// Admin KYC verification routes
router.get('/admin/kyc-queue', protect, isAdmin, getKYCQueue);
router.put('/admin/verify/:id', protect, isAdmin, verifyUser);

export default router;
