import Dispute from '../models/dispute.model.js';
import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import Booking from '../models/booking.model.js';
import Maintenance from '../models/maintenance.model.js';

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
 * System-wide Performance Analytics (ER: AnalyticsDashboard)
 */
export const getSystemActivity = async () => {
  const [
    totalUsers,
    totalTenants,
    totalOwners,
    pendingKYC,
    totalProperties,
    verifiedProperties,
    pendingProperties,
    allBookings,
    openDisputes,
    recentBookings,
    maintenanceTickets
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'TENANT' }),
    User.countDocuments({ role: { $in: ['OWNER', 'COMPANY_ADMIN', 'COMPANY_MANAGER'] } }),
    User.countDocuments({ kycStatus: 'PENDING' }),
    Property.countDocuments(),
    Property.countDocuments({ verificationStatus: 'VERIFIED' }),
    Property.countDocuments({ verificationStatus: 'PENDING' }),
    Booking.find({}).select('totalAmount status paymentStatus createdAt'),
    Dispute.countDocuments({ status: 'OPEN' }),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('tenant', 'firstName lastName email avatar phone')
      .populate({
        path: 'property',
        select: 'title location owner images tier',
        populate: { path: 'owner', select: 'firstName lastName email phone' }
      })
      .populate('room', 'roomType roomNumber basePrice'),
    Maintenance.find()
      .populate({
        path: 'property',
        select: 'title location owner images',
        populate: { path: 'owner', select: 'firstName lastName email phone' }
      })
      .populate('tenant', 'firstName lastName email avatar phone')
      .populate('room', 'roomType roomNumber')
      .sort('-createdAt')
      .limit(60)
  ]);

  // Aggregate Booking Finances & Performance
  const totalBookingsCount = allBookings.length;
  const confirmedBookings = allBookings.filter(b => ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'].includes(b.status));
  const activeCheckedIn = allBookings.filter(b => b.status === 'CHECKED_IN').length;
  
  const grossVolume = confirmedBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const paidVolume = allBookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  // Maintenance Ticket SLA Breakdown
  const totalTickets = maintenanceTickets.length;
  const openTickets = maintenanceTickets.filter(t => t.status === 'OPEN').length;
  const inProgressTickets = maintenanceTickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedTickets = maintenanceTickets.filter(t => t.status === 'RESOLVED').length;
  
  const now = Date.now();
  const slaBreachedTickets = maintenanceTickets.filter(t => {
    if (t.status === 'RESOLVED') return false;
    const hours = (now - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
    return hours > 24;
  }).length;

  return {
    overview: {
      totalUsers,
      totalTenants,
      totalOwners,
      pendingKYC,
      totalProperties,
      verifiedProperties,
      pendingProperties,
      totalBookings: totalBookingsCount,
      confirmedBookingsCount: confirmedBookings.length,
      activeCheckedIn,
      grossVolume,
      paidVolume,
      openDisputes,
      maintenance: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        slaBreached: slaBreachedTickets
      }
    },
    recentBookings,
    maintenanceTickets
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
  if (adminNote) user.kycRejectionReason = adminNote;
  
  await user.save();
  return { success: true, message: `User KYC updated to ${status}` };
};
