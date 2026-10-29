import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import * as userService from '../services/user.service.js';
import * as otpService from '../services/otp.service.js';
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import Booking from '../models/booking.model.js';
import Property from '../models/property.model.js';

// export const registerUser = async(req, res, next) => {
//     try {
//         const { firstName, lastName, email, password, role } = req.body;

//         const userExists = await User.findOne({email});
//         if(userExists) {
//             res.status(400);
//             throw new Error('User already exists');
//         }

//         const user = await User.create({
//             firstName,
//             lastName,
//             email,
//             password,
//             role: role || 'TENANT'
//         });

//         if(user) {
//             res.status(201).json({
//             _id: user._id,
//             firstName: user.firstName,
//             email: user.email,
//             role: user.role,
//             token: generateToken(user._id),
//             });
//         }
//     } catch (error) {
//         next(error);
//     }
// }

// @desc Auth user & get token
// @route POST /api/v1/auth/login

export const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // 1. Check for existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // 2. 󾠮 SECURITY LOCK: Role Sanitization
    // We only allow TENANT or OWNER roles from the public signup.
    // If someone tries to pass 'ADMIN', we force them to 'TENANT'.
    const publicRoles = ['TENANT', 'OWNER'];
    const sanitizedRole = publicRoles.includes(role) ? role : 'TENANT';

    // 3. Create the User
    const user = await User.create({
      firstName,
      lastName,
      email,
      password, // Password hashing happens in the Model pre-save hook
      role: sanitizedRole, 
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role, // Will be TENANT or OWNER
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    next(error);
  }
};

export const loginUser = async(req, res, next) => {
    try {
        const {email, password} = req.body;

        const user = await userService.findUserByEmail(email);

        if(user && (await userService.validateUserPassword(user, password))) {
            res.json({
            _id: user._id,
            firstName: user.firstName,
            role: user.role,
            token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password')
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
    let user = await userService.findUserByEmail(phone); // Simplified for logic

    // In a real app, find by phone. If not exists, create a partial user.
    if (!user) {
      user = await userService.createUser({ 
        phone, 
        firstName: 'Guest', 
        lastName: 'User',
        email: `${phone}@temp.com` // Placeholder
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



export const googleLogin = async (req, res, next) => {
  try {
    const { idToken, role } = req.body; // Role is only needed if it's a new user
    
    // 1. Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, given_name, family_name, picture } = ticket.getPayload();

    // 2. Find or Create User
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        firstName: given_name,
        lastName: family_name,
        avatar: picture,
        role: role || 'TENANT', // Default to tenant if not specified
        isEmailVerified: true, // Google already verified it
      });
    } else if (!user.googleId) {
      // If user exists via email but is now logging in via Google for the first time
      user.googleId = googleId;
      user.avatar = picture;
      await user.save();
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(401);
    next(new Error('Google authentication failed'));
  }
};

import axios from 'axios';

export const facebookLogin = async (req, res, next) => {
  try {
    const { accessToken, role } = req.body;

    // 1. Verify token & get user data from Facebook Graph API
    const { data } = await axios.get(
      `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=${accessToken}`
    );

    const { id: facebookId, first_name, last_name, email, picture } = data;

    // 2. Find or Create User
    let user = await User.findOne({ 
      $or: [{ facebookId }, { email }] 
    });

    if (!user) {
      user = await User.create({
        facebookId,
        email: email || `${facebookId}@facebook.com`, // FB doesn't always provide email
        firstName: first_name,
        lastName: last_name,
        avatar: picture?.data?.url,
        role: role || 'TENANT',
        isEmailVerified: true,
      });
    } else if (!user.facebookId) {
      user.facebookId = facebookId;
      if (!user.avatar) user.avatar = picture?.data?.url;
      await user.save();
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(401);
    next(new Error('Facebook authentication failed'));
  }
};

export const checkReviewEligibility = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // 󾠮 CRITICAL VERIFICATION:
    // We search for a booking that is associated with this User AND this Property
    // AND the status MUST be 'COMPLETED'.
    const completedBooking = await Booking.findOne({
      tenant: req.user._id,
      property: propertyId,
      status: 'COMPLETED' // 󾠯 OYO-style rule: Stayed, Checked-out.
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