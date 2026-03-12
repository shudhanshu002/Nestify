import crypto from 'crypto';
import Verification from '../models/verification.model';

// generate a random 6-digit OTP

export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// save OTP and simulate to user

export const sendOTP = async(userId, target, type) => {
    const otp = generateOTP();

    await Verification.deleteMany({userId, type});

    await Verification.create({
        userId,
        target,
        type,
        otp
    });

    console.log(`[DEV ONLY] Sending OTP ${otp} to ${target}`);
  
    return otp;
};

// verify OTP

export const verifyOTP = async (userId, otp, type) => {
  const record = await Verification.findOne({ userId, otp, type });
  
  if (!record) return false;

  // Clean up after successful verification
  await Verification.deleteOne({ _id: record._id });
  return true;
};