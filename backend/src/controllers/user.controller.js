import * as userService from '../services/user.service.js';
import Wishlist from '../models/wishlist.model.js';
import User from '../models/user.model.js'; 
import Notification from '../models/notification.model.js';
import Property from '../models/property.model.js';

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
    const user = await userService.findUserById(req.user._id);
    user.kycStatus = 'SUBMITTED';
    await user.save();

    res.json({ message: 'KYC documents submitted successfully' });
  } catch (error) {
    next(error);
  }
};

export const submitKYC = async (req, res, next) => {
  try {
    const docType = req.body.docType || req.body.documentType || 'AADHAAR';
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File upload failed" });
    }

    const user = await User.findById(req.user._id);
    if (!user.kycDocuments) user.kycDocuments = [];

    user.kycStatus = 'PENDING';
    user.kycDocuments.push({
      docType: docType || 'AADHAAR',
      fileUrl: req.file.path,
      uploadedAt: Date.now()
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "KYC submitted for review",
      data: user
    });
  } catch (error) { 
    console.error("KYC Submission Error:", error);
    next(error); 
  }
};

// @desc    Add or Remove property from wishlist
export const toggleWishlist = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }
    const userId = req.user._id;

    const existing = await Wishlist.findOne({ user: userId, property: propertyId });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      await User.findByIdAndUpdate(userId, { $pull: { wishlist: propertyId } });
      return res.json({ success: true, isFavorite: false, message: 'Removed from favorites' });
    }

    await Wishlist.create({ user: userId, property: propertyId });
    await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: propertyId } });
    res.status(201).json({ success: true, isFavorite: true, message: 'Added to favorites' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favorites
export const getMyWishlist = async (req, res, next) => {
  try {
    const favorites = await Wishlist.find({ user: req.user._id })
      .populate('property')
      .sort({ createdAt: -1 });

    const validFavorites = favorites.filter(item => item && item.property);
    res.json(validFavorites);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users waiting for KYC approval
// @route   GET /api/v1/users/admin/kyc-queue
// @access  Private/Admin
export const getKYCQueue = async (req, res, next) => {
  try {
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
    const { status, reason } = req.body;
    
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.kycStatus = status;
    if (status === 'REJECTED') {
      user.kycRejectionReason = reason || "Documents were not clear or invalid.";
    } else if (status === 'VERIFIED') {
      user.kycRejectionReason = '';
      if (!user.deal || user.deal.status === 'NOT_ELIGIBLE') {
        user.deal = {
          status: 'PENDING_SELECTION',
          dealType: 'COMMISSION_PERCENTAGE',
          annualTokenAmount: 9999,
          commissionRate: 6,
          paymentStatus: 'NOT_APPLICABLE'
        };
      }
    }

    await user.save();

    // Trigger Notification & Live Socket Sync
    try {
      const notif = await Notification.create({
        recipient: user._id,
        title: status === 'VERIFIED' ? '🎉 KYC Verification Approved!' : '⚠️ KYC Documents Rejected',
        message: status === 'VERIFIED'
          ? 'Your identity documents have been verified. You can now execute your commercial partnership deal (Annual Token vs Booking Commission).'
          : `Your identity verification was rejected. Reason: ${user.kycRejectionReason}`,
        type: 'KYC_UPDATE'
      });

      const io = req.app.get('io');
      if (io) {
        io.to(user._id.toString()).emit('kyc_updated', { status, deal: user.deal });
        io.to(user._id.toString()).emit('notification', notif);
        io.to(user._id.toString()).emit('unread_notification_count_changed');
      }
    } catch (notifErr) {
      console.error('Notification error in verifyUser:', notifErr);
    }

    res.status(200).json({ success: true, message: `User marked as ${status}`, data: user });
  } catch (error) { next(error); }
};

// @desc    Get owner's commercial deal status & plan options
// @route   GET /api/v1/users/deal
// @access  Private
export const getOwnerDeal = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isKycVerified = user.kycStatus === 'VERIFIED';

    // If verified and deal is not initialized or was NOT_ELIGIBLE, mark PENDING_SELECTION
    if (isKycVerified && (!user.deal || user.deal.status === 'NOT_ELIGIBLE')) {
      user.deal = {
        status: 'PENDING_SELECTION',
        dealType: 'COMMISSION_PERCENTAGE',
        annualTokenAmount: 9999,
        commissionRate: 6,
        paymentStatus: 'NOT_APPLICABLE'
      };
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        kycStatus: user.kycStatus,
        isEligible: isKycVerified,
        deal: user.deal || { status: 'NOT_ELIGIBLE' },
        plans: {
          ANNUAL_TOKEN: {
            title: 'Annual Token Membership',
            tagline: 'Fixed Annual Plan • 0% Booking Commission',
            amount: user.deal?.annualTokenAmount || 9999,
            commissionRate: 0,
            billingPeriod: '1 Year (365 Days)',
            features: [
              'Zero (0%) platform commission on all guest stays',
              'Keep 100% of guest rental receipts directly',
              'Valid for 365 days across all your PG listings',
              'Flagship Partner badge on all listings',
              'Direct tenant inquiries & priority discovery boost',
              'Complimentary legal tenant agreement templates'
            ]
          },
          COMMISSION_PERCENTAGE: {
            title: 'Pay-As-You-Earn Commission',
            tagline: '₹0 Upfront • Performance Commission',
            amount: 0,
            commissionRate: user.deal?.commissionRate || 6,
            billingPeriod: 'Per Confirmed Booking',
            features: [
              '₹0 Upfront or annual membership fee',
              'Nominal 6% commission fee only on confirmed bookings',
              'Automatic escrow deduction on check-in',
              'Risk-free flexibility for new or seasonal PG owners',
              'Standard verified landlord badge & concierge support',
              'Automated monthly GST invoices & payouts'
            ]
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Owner selects/signs commercial agreement
// @route   POST /api/v1/users/deal/select
// @access  Private (Owner)
export const selectOwnerDeal = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.kycStatus !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        message: 'Identity verification (KYC) must be approved before executing a platform commercial agreement.'
      });
    }

    const { dealType, signatureName } = req.body;
    if (!['ANNUAL_TOKEN', 'COMMISSION_PERCENTAGE'].includes(dealType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected. Choose ANNUAL_TOKEN or COMMISSION_PERCENTAGE.'
      });
    }

    const agreementRef = `NEST-AGR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const tokenAmount = user.deal?.annualTokenAmount || 9999;
    const commission = user.deal?.commissionRate || 6;

    user.deal = {
      status: 'ACTIVE',
      dealType,
      annualTokenAmount: tokenAmount,
      commissionRate: commission,
      agreementReference: agreementRef,
      agreedAt: now,
      validUntil: oneYearLater,
      termsAccepted: true,
      signatureName: (signatureName || `${user.firstName} ${user.lastName || ''}`).trim(),
      paymentStatus: dealType === 'ANNUAL_TOKEN' ? 'PAID' : 'NOT_APPLICABLE',
      adminNotes: user.deal?.adminNotes || ''
    };

    await user.save();

    // Create notification for owner
    const ownerNotification = await Notification.create({
      recipient: user._id,
      title: '📜 Platform Agreement Signed & Active!',
      message: `Your commercial partnership agreement (${dealType === 'ANNUAL_TOKEN' ? `Annual Token Plan (₹${tokenAmount}/yr)` : `Pay-As-You-Earn (${commission}%)`}) is now ACTIVE. Reference: ${agreementRef}.`,
      type: 'COMMERCIAL_DEAL'
    });

    const io = req.app.get('io');
    if (io) {
      io.to(user._id.toString()).emit('deal_updated', user.deal);
      io.to(user._id.toString()).emit('notification', ownerNotification);
      io.to(user._id.toString()).emit('unread_notification_count_changed');
    }

    res.status(200).json({
      success: true,
      message: 'Platform commercial agreement executed successfully!',
      data: user.deal
    });
  } catch (error) {
    next(error);
  }
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
