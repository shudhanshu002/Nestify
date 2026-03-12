import * as userService from '../services/user.service.js';

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.user._id);
    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update KYC status
// @route   PUT /api/v1/users/kyc
// @access  Private
export const updateKYC = async (req, res, next) => {
  try {
    const { kycData } = req.body; 
    // Logic for document upload would go here
    
    const user = await userService.findUserById(req.user._id);
    user.kycStatus = 'SUBMITTED';
    await user.save();

    res.json({ message: 'KYC documents submitted successfully' });
  } catch (error) {
    next(error);
  }
};