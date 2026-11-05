import crypto from 'crypto';
import mongoose from 'mongoose';
import Verification from '../models/verification.model.js';

// Generate a random 6-digit numeric OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Save OTP record to database
 * @param {string|null} userId - optional user ObjectId
 * @param {string} target - email or phone number
 * @param {string} type - 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'LOGIN_OTP' | 'PASSWORD_RESET'
 */
export const sendOTP = async (userId, target, type) => {
  const otp = generateOTP();
  const cleanTarget = (target || '').toLowerCase().trim();

  // Clear any existing pending verification codes for this target and type
  const filter = { type };
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    filter.$or = [{ userId }, { target: cleanTarget }];
  } else {
    filter.target = cleanTarget;
  }
  await Verification.deleteMany(filter);

  await Verification.create({
    userId: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : undefined,
    target: cleanTarget,
    type,
    otp
  });

  return otp;
};

/**
 * Verify OTP against database
 * @param {string} targetOrUserId - email/phone or userId
 * @param {string} otp - 6-digit OTP
 * @param {string} type - verification type
 */
export const verifyOTP = async (targetOrUserId, otp, type) => {
  if (!targetOrUserId || !otp) return false;

  const cleanTarget = targetOrUserId.toString().toLowerCase().trim();
  const cleanOtp = otp.toString().trim();

  const query = {
    type,
    otp: cleanOtp
  };

  const orConditions = [{ target: cleanTarget }];
  if (mongoose.Types.ObjectId.isValid(targetOrUserId) && targetOrUserId.toString().length === 24) {
    orConditions.push({ userId: targetOrUserId });
  }

  query.$or = orConditions;

  const record = await Verification.findOne(query);

  if (!record) return false;

  // Clean up after successful verification
  await Verification.deleteOne({ _id: record._id });
  return true;
};
