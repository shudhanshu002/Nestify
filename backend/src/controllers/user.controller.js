import * as userService from '../services/user.service.js';
import Wishlist from '../models/wishlist.model.js';

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

// @desc    Add property to wishlist
export const toggleWishlist = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user._id;

    const existing = await Wishlist.findOne({ user: userId, property: propertyId });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return res.json({ message: 'Removed from favorites' });
    }

    await Wishlist.create({ user: userId, property: propertyId });
    res.status(201).json({ message: 'Added to favorites' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favorites
export const getMyWishlist = async (req, res, next) => {
  try {
    const favorites = await Wishlist.find({ user: req.user._id })
      .populate('property', 'title location basePrice images averageRating');
    res.json(favorites);
  } catch (error) {
    next(error);
  }
};