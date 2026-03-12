import express from 'express';
import { registerUser, loginUser, requestOTP, verifyOTPAndLogin } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/otp/request', requestOTP);
router.post('/otp/verify', verifyOTPAndLogin);

export default router;