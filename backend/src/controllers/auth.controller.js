import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import * as userService from '../services/user.service.js';
import * as otpService from '../services/otp.service.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Booking from '../models/booking.model.js';
import Property from '../models/property.model.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc Register user
// @route POST /api/v1/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // 1. Check for existing user
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    // 2. SECURITY LOCK: Role Sanitization
    const publicRoles = ['TENANT', 'OWNER'];
    const sanitizedRole = publicRoles.includes(role) ? role : 'TENANT';

    // 3. Create the User
    const user = await User.create({
      firstName,
      lastName: lastName || '',
      email: email.toLowerCase(),
      password, // Password hashing happens in the Model pre-save hook
      role: sanitizedRole,
    });

    if (user) {
      const userPayload = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
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

// @desc    Google OAuth Login & Registration
// @route   POST /api/v1/auth/google
export const googleLogin = async (req, res, next) => {
  try {
    const { idToken, credential, role, profile: clientProfile } = req.body;
    const token = idToken || credential;

    let googleId = null;
    let email = null;
    let given_name = null;
    let family_name = null;
    let picture = null;

    if (token) {
      try {
        if (process.env.GOOGLE_CLIENT_ID) {
          const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          googleId = payload.sub;
          email = payload.email;
          given_name = payload.given_name || payload.name?.split(' ')[0] || 'User';
          family_name = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
          picture = payload.picture;
        } else {
          // If no GOOGLE_CLIENT_ID configured on backend yet, parse payload
          const decoded = jwt.decode(token);
          if (decoded && decoded.email) {
            googleId = decoded.sub || `google_${Date.now()}`;
            email = decoded.email;
            given_name = decoded.given_name || decoded.name?.split(' ')[0] || 'User';
            family_name = decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || '';
            picture = decoded.picture;
          }
        }
      } catch (verifyErr) {
        console.warn("Google verify failed, checking token decode:", verifyErr.message);
        const decoded = jwt.decode(token);
        if (decoded && decoded.email) {
          googleId = decoded.sub || `google_${Date.now()}`;
          email = decoded.email;
          given_name = decoded.given_name || decoded.name?.split(' ')[0] || 'User';
          family_name = decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || '';
          picture = decoded.picture;
        }
      }
    }

    // Direct fallback from client payload
    if (!email && clientProfile?.email) {
      email = clientProfile.email;
      googleId = clientProfile.id || clientProfile.sub || `google_${Date.now()}`;
      given_name = clientProfile.given_name || clientProfile.firstName || 'User';
      family_name = clientProfile.family_name || clientProfile.lastName || '';
      picture = clientProfile.picture || clientProfile.avatar;
    }

    if (!email) {
      res.status(400);
      throw new Error('Valid Google credential or verified email is required');
    }

    const publicRoles = ['TENANT', 'OWNER'];
    const sanitizedRole = publicRoles.includes(role) ? role : 'TENANT';

    let user = await User.findOne({ 
      $or: [{ googleId }, { email: email.toLowerCase() }] 
    });

    if (!user) {
      user = await User.create({
        googleId,
        email: email.toLowerCase(),
        firstName: given_name || 'Nestify',
        lastName: family_name || 'Resident',
        avatar: picture || '',
        role: sanitizedRole,
        isEmailVerified: true,
      });
    } else {
      let modified = false;
      if (!user.googleId && googleId) {
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
      avatar: user.avatar || user.profile?.avatar || '',
    };

    res.json({
      ...userPayload,
      token: generateToken(user._id),
      user: userPayload,
    });
  } catch (error) {
    res.status(401);
    next(error);
  }
};

// @desc    Facebook OAuth Login & Registration
// @route   POST /api/v1/auth/facebook
export const facebookLogin = async (req, res, next) => {
  try {
    const { 
      accessToken, 
      role, 
      email: clientEmail, 
      firstName: clientFirst, 
      lastName: clientLast, 
      id: clientId, 
      avatar: clientAvatar 
    } = req.body;

    let facebookId = clientId;
    let email = clientEmail;
    let first_name = clientFirst;
    let last_name = clientLast;
    let picture = clientAvatar;

    // 1. If accessToken provided, query Facebook Graph API
    if (accessToken) {
      try {
        const { data } = await axios.get(
          `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture.type(large)&access_token=${accessToken}`
        );
        if (data && data.id) {
          facebookId = data.id;
          if (data.email) email = data.email;
          if (data.first_name) first_name = data.first_name;
          if (data.last_name) last_name = data.last_name;
          if (data.picture?.data?.url) picture = data.picture.data.url;
        }
      } catch (fbErr) {
        console.warn("Facebook Graph API call failed, using client details:", fbErr.message);
      }
    }

    if (!facebookId && !email) {
      res.status(400);
      throw new Error('Valid Facebook credential or account profile is required');
    }

    const publicRoles = ['TENANT', 'OWNER'];
    const sanitizedRole = publicRoles.includes(role) ? role : 'TENANT';

    let user = null;
    if (email) {
      user = await User.findOne({ $or: [{ facebookId }, { email: email.toLowerCase() }] });
    } else if (facebookId) {
      user = await User.findOne({ facebookId });
    }

    if (!user) {
      const fallbackEmail = email ? email.toLowerCase() : `fb_${facebookId || Date.now()}@nestify.app`;
      user = await User.create({
        facebookId,
        email: fallbackEmail,
        firstName: first_name || 'Facebook',
        lastName: last_name || 'Resident',
        avatar: picture || '',
        role: sanitizedRole,
        isEmailVerified: true,
      });
    } else {
      let modified = false;
      if (!user.facebookId && facebookId) {
        user.facebookId = facebookId;
        modified = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
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
      avatar: user.avatar || user.profile?.avatar || '',
    };

    res.json({
      ...userPayload,
      token: generateToken(user._id),
      user: userPayload,
    });
  } catch (error) {
    res.status(401);
    next(error);
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
