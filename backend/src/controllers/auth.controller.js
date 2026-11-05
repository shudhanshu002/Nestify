import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import * as userService from '../services/user.service.js';
import * as otpService from '../services/otp.service.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Booking from '../models/booking.model.js';
import Property from '../models/property.model.js';

const googleClientId = process.env.CLIENT_ID_GOOGLE || process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(googleClientId);

// @desc    Send Registration OTP to Email
// @route   POST /api/v1/auth/send-register-otp
export const sendRegisterOTP = async (req, res, next) => {
  try {
    const { email, firstName } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email already exists. Please sign in instead.' 
      });
    }

    // 2. Generate and store OTP in database
    const otp = await otpService.sendOTP(null, cleanEmail, 'EMAIL_VERIFICATION');

    // 3. Dispatch verification email directly to user's inbox
    await sendVerificationEmail(cleanEmail, otp, firstName || 'Resident');

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`
    });
  } catch (error) {
    console.error("sendRegisterOTP error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send verification code. Please check your email configuration.'
    });
  }
};

// @desc Register user with verified email OTP
// @route POST /api/v1/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, otp } = req.body;

    if (!email || !password || !firstName) {
      return res.status(400).json({ success: false, message: 'First name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check for existing user
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // 2. Verify Email OTP
    if (!otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email verification code is required to complete registration.' 
      });
    }

    const isValid = await otpService.verifyOTP(cleanEmail, otp, 'EMAIL_VERIFICATION');
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code. Please request a new one.' 
      });
    }

    // 3. SECURITY LOCK: Role Sanitization
    const publicRoles = ['TENANT', 'OWNER'];
    const sanitizedRole = publicRoles.includes(role) ? role : 'TENANT';

    // 4. Create the User with verified email
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      email: cleanEmail,
      password,
      role: sanitizedRole,
      isEmailVerified: true
    });

    if (user) {
      const userPayload = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isSuperAdmin: !!user.isSuperAdmin,
        isEmailVerified: true,
        avatar: user.avatar || user.profile?.avatar || '',
      };
      res.status(201).json({
        ...userPayload,
        token: generateToken(user._id),
        user: userPayload,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Auth user & get token
// @route POST /api/v1/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userService.findUserByEmail(email);

    if (user && (await userService.validateUserPassword(user, password))) {
      const userPayload = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isSuperAdmin: !!user.isSuperAdmin,
        avatar: user.avatar || user.profile?.avatar || '',
      };
      res.json({
        ...userPayload,
        token: generateToken(user._id),
        user: userPayload,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Request OTP for Phone Login/Verification
// @route   POST /api/v1/auth/otp/request
export const requestOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    let user = await userService.findUserByEmail(phone);

    if (!user) {
      user = await userService.createUser({ 
        phone, 
        firstName: 'Guest', 
        lastName: 'User',
        email: `${phone}@temp.com`
      });
    }

    const otp = await otpService.sendOTP(user._id, phone, 'LOGIN_OTP');
    
    res.status(200).json({ message: 'OTP sent successfully', sessionId: user._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and Login
// @route   POST /api/v1/auth/otp/verify
export const verifyOTPAndLogin = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const isValid = await otpService.verifyOTP(userId, otp, 'LOGIN_OTP');

    if (!isValid) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    const user = await userService.findUserById(userId);
    user.isPhoneVerified = true;
    await user.save();

    res.json({
      _id: user._id,
      token: generateToken(user._id),
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Real Google OAuth 2.0 Login & Registration
// @route   POST /api/v1/auth/google
export const googleLogin = async (req, res, next) => {
  try {
    const { accessToken, idToken, credential, role } = req.body;
    const token = idToken || credential;

    let googleId = null;
    let email = null;
    let given_name = null;
    let family_name = null;
    let picture = null;

    // 1. If OAuth2 access_token provided (from Google OAuth 2.0 popup)
    if (accessToken) {
      const { data: googleUser } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (googleUser && googleUser.email) {
        googleId = googleUser.sub;
        email = googleUser.email.toLowerCase();
        given_name = googleUser.given_name || googleUser.name?.split(' ')[0] || 'Resident';
        family_name = googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '';
        picture = googleUser.picture || '';
      }
    } else if (token) {
      // 2. If ID Token / Credential provided
      const clientId = process.env.CLIENT_ID_GOOGLE || process.env.GOOGLE_CLIENT_ID;
      if (clientId) {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        googleId = payload.sub;
        email = payload.email.toLowerCase();
        given_name = payload.given_name || payload.name?.split(' ')[0] || 'Resident';
        family_name = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
        picture = payload.picture || '';
      } else {
        const decoded = jwt.decode(token);
        if (decoded && decoded.email) {
          googleId = decoded.sub;
          email = decoded.email.toLowerCase();
          given_name = decoded.given_name || decoded.name?.split(' ')[0] || 'Resident';
          family_name = decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || '';
          picture = decoded.picture || '';
        }
      }
    }

    if (!googleId || !email) {
      res.status(401);
      throw new Error('Google authentication failed: unable to verify credentials from Google servers.');
    }

    const publicRoles = ['TENANT', 'OWNER'];
    const sanitizedRole = publicRoles.includes(role) ? role : 'TENANT';

    let user = await User.findOne({ 
      $or: [{ googleId }, { email }] 
    });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        firstName: given_name,
        lastName: family_name,
        avatar: picture,
        role: sanitizedRole,
        isEmailVerified: true,
      });
    } else {
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (modified) await user.save();
    }

    const userPayload = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isSuperAdmin: !!user.isSuperAdmin,
      avatar: user.avatar || user.profile?.avatar || '',
    };

    res.json({
      ...userPayload,
      token: generateToken(user._id),
      user: userPayload,
    });
  } catch (error) {
    res.status(401);
    next(new Error(error.response?.data?.error_description || error.message || 'Google authentication failed'));
  }
};

export const checkReviewEligibility = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const completedBooking = await Booking.findOne({
      tenant: req.user._id,
      property: propertyId,
      status: 'COMPLETED'
    });

    if (!completedBooking) {
      return res.status(200).json({
        success: true,
        eligible: false,
        message: "You can only rate after completing a stay."
      });
    }

    res.status(200).json({
      success: true,
      eligible: true,
      message: "Eligibility confirmed."
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send verification OTP for existing unverified user
// @route   POST /api/v1/auth/send-verify-email-otp
export const sendVerifyEmailOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }

    const otp = await otpService.sendOTP(user._id, user.email, 'EMAIL_VERIFICATION');
    await sendVerificationEmail(user.email, otp, user.firstName);

    res.status(200).json({ success: true, message: `Verification code sent to ${user.email}.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email for existing user
// @route   POST /api/v1/auth/verify-email
export const verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isValid = await otpService.verifyOTP(user.email, otp, 'EMAIL_VERIFICATION');
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    next(error);
  }
};
