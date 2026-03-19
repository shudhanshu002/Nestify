import Dispute from '../models/dispute.model.js';
import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import Booking from '../models/booking.model.js';

/**
 * Resolves a dispute and impacts the Owner's Trust Signals (ER requirement)
 */
export const resolveDispute = async (disputeId, resolutionData, adminId) => {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new Error('Dispute not found');

  dispute.status = 'RESOLVED';
  dispute.resolution = resolutionData.text;
  dispute.resolvedBy = adminId;
  dispute.resolvedAt = Date.now();
  
  // Track SLA (Service Level Agreement)
  const resolutionTime = dispute.resolvedAt - dispute.createdAt;
  dispute.slaBreached = resolutionTime > (24 * 60 * 60 * 1000); // Breach if > 24hrs

  await dispute.save();

  // IMPACT TRUST SIGNALS: If the owner was at fault, decrease their Quality Score
  if (resolutionData.fault === 'OWNER') {
    await Property.findByIdAndUpdate(dispute.property, { 
      $inc: { 
        ownerQualityScore: -10, // ER Field: OwnerQualityScore
        smartMatchScore: -5     // ER Field: SmartMatchScore
      } 
    });
  }

  return { success: true, dispute };
};

/**
 * System-wide Dashboard Analytics (ER: AnalyticsDashboard)
 */
export const getSystemActivity = async () => {
  const [totalUsers, pendingKYC, openDisputes, recentBookings] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ kycStatus: 'PENDING' }),
    Dispute.countDocuments({ status: 'OPEN' }),
    Booking.find().sort({ createdAt: -1 }).limit(5).populate('tenant', 'firstName lastName')
  ]);

  return {
    overview: {
      totalUsers,
      pendingVerifications: pendingKYC,
      activeDisputes: openDisputes
    },
    recentActivity: recentBookings
  };
};

/**
 * Manage User KYC (ER: completes → UserKYC)
 */
export const manageUserKYC = async (userId, status, adminNote) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.kycStatus = status; // VERIFIED or REJECTED
  if (status === 'VERIFIED') user.isIdentityVerified = true;
  
  await user.save();
  return { success: true, message: `User KYC updated to ${status}` };
};