import User from "../models/user.model";
import generateToken from "../utils/generateToken";
import * as userService from '../services/user.service.js';
import * as otpService from '../services/otp.service.js';

export const registerUser = async(req, res, next) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        const userExists = await User.findOne({email});
        if(userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: role || 'TENANT'
        });

        if(user) {
            res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            });
        }
    } catch (error) {
        next(error);
    }
}

// @desc Auth user & get token
// @route POST /api/v1/auth/login
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