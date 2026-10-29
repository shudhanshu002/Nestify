import * as userService from '../services/user.service.js';
import Wishlist from '../models/wishlist.model.js';
// src/controllers/user.controller.js
import User from '../models/user.model.js'; 
import Notification from '../models/notification.model.js';

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


// import User from '../models/user.model.js'; 

export const submitKYC = async (req, res, next) => {
  console.log("󾟔 KYC Request Received for User:", req.user._id); // This MUST show in terminal
  
  try {
    const docType = req.body.docType || req.body.documentType || 'AADHAAR';
    
    if (!req.file) {
      console.log("󾭿 Upload Error: No file found in request");
      return res.status(400).json({ success: false, message: "File upload failed" });
    }

    console.log("󾓿 File received:", req.file.path);

    const user = await User.findById(req.user._id);

    // Initialize array if missing (safety for legacy users)
    if (!user.kycDocuments) user.kycDocuments = [];

    user.kycStatus = 'PENDING';
    user.kycDocuments.push({
      docType: docType || 'AADHAAR',
      fileUrl: req.file.path,
      uploadedAt: Date.now()
    });

    await user.save();
    console.log("󾓲 Database Updated Successfully");

    res.status(200).json({
      success: true,
      message: "KYC submitted for review",
      data: user
    });
  } catch (error) { 
    console.error("󾭿 KYC Submission Error:", error);
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


// @desc    Get all users waiting for KYC approval
// @route   GET /api/v1/users/admin/kyc-queue
// @access  Private/Admin
export const getKYCQueue = async (req, res, next) => {
  try {
    // Find all users where kycStatus is PENDING
    const queue = await User.find({ kycStatus: 'PENDING' })
      .select('firstName lastName email kycDocuments kycStatus createdAt')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: queue });
  } catch (error) { next(error); }
};

// @desc    Approve or Reject a KYC submission
// @route   PUT /api/v1/users/admin/verify/:id
// @access  Private/Admin
export const verifyUser = async (req, res, next) => {
  try {
    const { status, reason } = req.body; // status: 'VERIFIED' or 'REJECTED'
    
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.kycStatus = status;
    if (status === 'REJECTED') {
      user.kycRejectionReason = reason || "Documents were not clear or invalid.";
    }

    await user.save();
    res.status(200).json({ success: true, message: `User marked as ${status}` });
  } catch (error) { next(error); }
};




export const verifyProperty = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const property = await Property.findById(req.params.id).populate('owner');

    if (!property) return res.status(404).json({ message: "Property not found" });

    property.verificationStatus = status;
    if (status === 'REJECTED') {
      property.rejectionReason = reason;
    }
    
    await property.save();

    // 󾠮 CREATE NOTIFICATION
    await Notification.create({
      recipient: property.owner._id,
      title: status === 'VERIFIED' ? '🎉 Property Live!' : '⚠️ Action Required: Property Rejected',
      message: status === 'VERIFIED' 
        ? `Your property "${property.title}" has been verified and is now live for tenants.` 
        : `Your property "${property.title}" was rejected. Reason: ${reason}. Please resubmit the documents.`,
      relatedId: property._id
    });

    res.status(200).json({ success: true, message: `Status updated to ${status}` });
  } catch (error) { next(error); }
};