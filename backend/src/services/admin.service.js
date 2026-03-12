import Dispute from '../models/dispute.model.js';
import User from '../models/user.model.js';
import Property from '../models/property.model.js';

/**
 * Resolves a dispute and updates trust signals
 */
export const resolveDispute = async (disputeId, resolutionData, adminId) => {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new Error('Dispute not found');

  dispute.status = 'RESOLVED';
  dispute.resolution = resolutionData.text;
  dispute.resolvedBy = adminId;
  await dispute.save();

  // If the owner was at fault, decrease their OwnerQualityScore (ER Signal)
  if (resolutionData.fault === 'OWNER') {
    await Property.findByIdAndUpdate(dispute.property, { $inc: { smartMatchScore: -5 } });
  }

  return dispute;
};

/**
 * System-wide Audit Log (Simplified)
 */
export const getSystemActivity = async () => {
  // Logic to return recent bookings, new users, and flagged reviews
  return {
    totalUsers: await User.countDocuments(),
    activeDisputes: await Dispute.countDocuments({ status: 'OPEN' }),
  };
};