import express from 'express';
import Property from '../models/property.model.js'; 
import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import Maintenance from '../models/maintenance.model.js';
import Notification from '../models/notification.model.js';
import { resolveDispute, getSystemActivity } from '../services/admin.service.js';
import { protect, authorize, isSuperAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Only Admins can access these - applies to every route below
router.use(protect, authorize('ADMIN'));

const handleDashboardAnalytics = async (req, res, next) => {
  try {
    const stats = await getSystemActivity();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

router.get('/dashboard', handleDashboardAnalytics);
router.get('/analytics', handleDashboardAnalytics);

// Admin: Escalate an SLA-breached ticket to the property owner
router.post('/tickets/:id/escalate', async (req, res, next) => {
  try {
    const ticket = await Maintenance.findById(req.params.id)
      .populate('property')
      .populate('tenant', 'firstName lastName');

    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    const ownerId = ticket.property?.owner;
    if (ownerId) {
      const shortId = `#${ticket._id.toString().slice(-6).toUpperCase()}`;
      const note = req.body.note || "Admin has escalated this ticket due to SLA breach (>24 hours). Urgent action required.";

      ticket.adminNotes = note;
      ticket.priority = 'HIGH';
      await ticket.save();

      const notification = await Notification.create({
        recipient: ownerId,
        title: `🚨 URGENT SLA Escalation: Ticket ${shortId}`,
        message: `${note} PG: "${ticket.property?.title || 'Your PG'}". Tenant: ${ticket.tenant?.firstName || 'Resident'}.`,
        type: 'MAINTENANCE',
        relatedId: ticket._id
      });

      const io = req.app.get('io');
      if (io) {
        io.to(ownerId.toString()).emit('ticket_escalated', { ticket, notification });
        io.to(ownerId.toString()).emit('notification', notification);
        io.to(ownerId.toString()).emit('unread_notification_count_changed');
      }
    }

    res.status(200).json({ success: true, message: "Escalation notice dispatched to property owner.", data: ticket });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all owners along with their listed PGs, rooms, and ratings
// @route   GET /api/v1/admin/owners-directory and /api/v1/admin/owners-overview
const handleOwnersOverview = async (req, res, next) => {
  try {
    // 1. Fetch all distinct owner IDs from properties + users with role OWNER, COMPANY_ADMIN, or COMPANY_MANAGER
    const distinctPropertyOwnerIds = await Property.distinct('owner');
    
    const owners = await User.find({ 
      $or: [
        { role: { $in: ['OWNER', 'COMPANY_ADMIN', 'COMPANY_MANAGER'] } },
        { _id: { $in: distinctPropertyOwnerIds.filter(Boolean) } }
      ]
    }).select('-password').sort('-createdAt');

    const ownerIds = owners.map(o => o._id);

    // 2. Fetch all properties listed across the platform
    const properties = await Property.find({})
      .populate('owner', 'firstName lastName email avatar phone role')
      .sort('-createdAt');

    // 3. Fetch all rooms
    const rooms = await Room.find({});

    // 4. Map properties and rooms to each owner
    const ownersData = owners.map(owner => {
      const ownerObj = owner.toObject();
      const ownerProperties = properties
        .filter(p => (p.owner?._id || p.owner)?.toString() === owner._id.toString())
        .map(p => {
          const propObj = p.toObject();
          propObj.rooms = rooms.filter(r => r.property?.toString() === p._id.toString());
          return propObj;
        });

      ownerObj.properties = ownerProperties;
      ownerObj.totalProperties = ownerProperties.length;
      ownerObj.verifiedPropertiesCount = ownerProperties.filter(p => p.verificationStatus === 'VERIFIED').length;
      return ownerObj;
    });

    res.status(200).json({
      success: true,
      count: ownersData.length,
      totalProperties: properties.length,
      data: ownersData
    });
  } catch (error) {
    next(error);
  }
};

router.get('/owners-directory', handleOwnersOverview);
router.get('/owners-overview', handleOwnersOverview);

router.put('/disputes/:id/resolve', async (req, res, next) => {
  try {
    const resolved = await resolveDispute(req.params.id, req.body, req.user._id);
    res.json({ success: true, data: resolved });
  } catch (error) {
    next(error);
  }
});

// @desc    Admin: Approve or Reject a Property Listing
const handlePropertyVerification = async (req, res, next) => {
  try {
    const { status, rejectionReason, reason, tier, badge } = req.body;
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const newStatus = status ? status.toUpperCase() : 'VERIFIED';
    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(newStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid verification status. Must be VERIFIED, REJECTED, or PENDING." 
      });
    }

    property.verificationStatus = newStatus;
    if (newStatus === 'REJECTED') {
      property.rejectionReason = rejectionReason || reason || 'Property documents or details did not meet platform guidelines.';
    } else if (newStatus === 'VERIFIED') {
      property.rejectionReason = '';
    }

    if (tier && ['FLAGSHIP', 'LUXURY', 'BUDGET', 'STANDARD'].includes(tier)) {
      property.tier = tier;
    }

    await property.save();

    // Trigger Notification & Socket Event for Owner
    if (property.owner) {
      const ownerId = (property.owner._id || property.owner).toString();
      const notification = await Notification.create({
        recipient: ownerId,
        title: newStatus === 'VERIFIED' ? 'Building Approved! 🚀' : 'Action Required: Listing Rejected',
        message: newStatus === 'VERIFIED'
          ? `Great news! "${property.title}" has been verified and is now live for tenants on Nestify.`
          : `Your property "${property.title}" was rejected. Reason: ${property.rejectionReason}. Please update your documents.`,
        type: 'PROPERTY_VERIFICATION',
        relatedId: property._id
      });

      const io = req.app.get('io');
      if (io) {
        io.to(ownerId).emit('property_verified', { propertyId: property._id, status: newStatus });
        io.to(ownerId).emit('notification', notification);
        io.to(ownerId).emit('unread_notification_count_changed');
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Property status updated to ${newStatus}`,
      data: property 
    });
  } catch (error) {
    next(error);
  }
};

router.patch('/verify-property/:id', handlePropertyVerification);
router.put('/verify-property/:id', handlePropertyVerification);

// @desc    Admin: Update/Override Owner Commercial Deal & Agreement Terms
// @route   PATCH /api/v1/admin/owners/:id/deal
router.patch('/owners/:id/deal', async (req, res, next) => {
  try {
    const { dealType, annualTokenAmount, commissionRate, status, adminNotes } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    if (!user.deal) {
      user.deal = {
        status: user.kycStatus === 'VERIFIED' ? 'PENDING_SELECTION' : 'NOT_ELIGIBLE',
        dealType: 'COMMISSION_PERCENTAGE',
        annualTokenAmount: 9999,
        commissionRate: 6,
        paymentStatus: 'NOT_APPLICABLE'
      };
    }

    if (dealType && ['ANNUAL_TOKEN', 'COMMISSION_PERCENTAGE'].includes(dealType)) {
      user.deal.dealType = dealType;
    }
    if (annualTokenAmount !== undefined) {
      user.deal.annualTokenAmount = Number(annualTokenAmount);
    }
    if (commissionRate !== undefined) {
      user.deal.commissionRate = Number(commissionRate);
    }
    if (status && ['NOT_ELIGIBLE', 'PENDING_SELECTION', 'ACTIVE', 'EXPIRED'].includes(status)) {
      user.deal.status = status;
      if (status === 'ACTIVE' && !user.deal.agreementReference) {
        user.deal.agreementReference = `NEST-AGR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        user.deal.agreedAt = new Date();
        user.deal.validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        user.deal.termsAccepted = true;
      }
    }
    if (adminNotes !== undefined) {
      user.deal.adminNotes = adminNotes;
    }
    user.deal.updatedBy = req.user._id;

    await user.save();

    // Trigger Notification & Live Socket for Owner
    const notification = await Notification.create({
      recipient: user._id,
      title: '💼 Commercial Deal Terms Updated',
      message: `Admin has adjusted your commercial terms: ${user.deal.dealType === 'ANNUAL_TOKEN' ? `Annual Token (₹${user.deal.annualTokenAmount}/yr)` : `Pay-As-You-Earn (${user.deal.commissionRate}%)`}. Status: ${user.deal.status}.`,
      type: 'COMMERCIAL_DEAL'
    });

    const io = req.app.get('io');
    if (io) {
      io.to(user._id.toString()).emit('deal_updated', user.deal);
      io.to(user._id.toString()).emit('notification', notification);
      io.to(user._id.toString()).emit('unread_notification_count_changed');
    }

    res.status(200).json({
      success: true,
      message: 'Owner commercial deal updated successfully',
      data: user.deal
    });
  } catch (error) {
    next(error);
  }
});
router.put('/owners/:id/deal', async (req, res, next) => {
  // Delegate to same handler
  req.url = `/owners/${req.params.id}/deal`;
  router.handle(req, res, next);
});

// ============================================================
// MAJOR ADMIN (SUPER ADMIN) GOVERNANCE & ALLOTMENT ENDPOINTS
// ============================================================

// @desc    Get all platform administrators (Only accessible by Major Admin)
// @route   GET /api/v1/admin/manage-admins
router.get('/manage-admins', isSuperAdmin, async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'ADMIN' })
      .select('firstName lastName email role isSuperAdmin adminSuspended isActive createdAt managedByAdmin')
      .populate('managedByAdmin', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create a new Admin or Promote an existing user to ADMIN
// @route   POST /api/v1/admin/manage-admins
router.post('/manage-admins', isSuperAdmin, async (req, res, next) => {
  try {
    const { email, firstName, lastName, password, mode } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    let targetUser = await User.findOne({ email: cleanEmail });

    if (mode === 'CREATE_NEW' || !targetUser) {
      if (!firstName || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "First name and password are required to create a new Administrator." 
        });
      }

      if (targetUser) {
        return res.status(400).json({ 
          success: false, 
          message: "A user with this email already exists. Use promote option instead." 
        });
      }

      targetUser = await User.create({
        firstName,
        lastName: lastName || '',
        email: cleanEmail,
        password,
        role: 'ADMIN',
        isSuperAdmin: false,
        isEmailVerified: true,
        managedByAdmin: req.user._id,
        adminSuspended: false
      });
    } else {
      // Promote existing user to ADMIN
      targetUser.role = 'ADMIN';
      targetUser.isSuperAdmin = false;
      targetUser.adminSuspended = false;
      targetUser.managedByAdmin = req.user._id;
      await targetUser.save();
    }

    // Trigger notification
    await Notification.create({
      recipient: targetUser._id,
      title: 'Platform Administrator Privilege Granted 🛡️',
      message: `You have been allotted Administrator privileges by Major Admin ${req.user.firstName} ${req.user.lastName}.`,
      type: 'SYSTEM'
    });

    res.status(201).json({
      success: true,
      message: `Admin privileges granted to ${targetUser.email}`,
      data: {
        _id: targetUser._id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        role: targetUser.role,
        isSuperAdmin: targetUser.isSuperAdmin,
        adminSuspended: targetUser.adminSuspended
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Close / Suspend an Admin account
// @route   PATCH /api/v1/admin/manage-admins/:id/close
router.patch('/manage-admins/:id/close', isSuperAdmin, async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: "Action Prohibited: Major Admin cannot suspend or close their own account." 
      });
    }

    const targetAdmin = await User.findById(targetId);
    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: "Admin user not found." });
    }

    if (targetAdmin.isSuperAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Action Prohibited: Another Major Admin cannot be suspended." 
      });
    }

    targetAdmin.adminSuspended = true;
    await targetAdmin.save();

    await Notification.create({
      recipient: targetAdmin._id,
      title: 'Administrator Access Closed ⚠️',
      message: `Your administrator account privileges were closed by Major Admin ${req.user.firstName}.`,
      type: 'SYSTEM'
    });

    res.status(200).json({
      success: true,
      message: `Administrator ${targetAdmin.email} has been closed/suspended.`,
      data: {
        _id: targetAdmin._id,
        email: targetAdmin.email,
        adminSuspended: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Reactivate a closed Admin account
// @route   PATCH /api/v1/admin/manage-admins/:id/activate
router.patch('/manage-admins/:id/activate', isSuperAdmin, async (req, res, next) => {
  try {
    const targetAdmin = await User.findById(req.params.id);
    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: "Admin user not found." });
    }

    targetAdmin.adminSuspended = false;
    await targetAdmin.save();

    res.status(200).json({
      success: true,
      message: `Administrator ${targetAdmin.email} has been reactivated.`,
      data: {
        _id: targetAdmin._id,
        email: targetAdmin.email,
        adminSuspended: false
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Revoke Admin privileges completely (Demote to TENANT or OWNER)
// @route   PATCH /api/v1/admin/manage-admins/:id/demote
router.patch('/manage-admins/:id/demote', isSuperAdmin, async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: "Action Prohibited: Major Admin cannot demote their own account." 
      });
    }

    const targetAdmin = await User.findById(targetId);
    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const fallbackRole = req.body.targetRole === 'OWNER' ? 'OWNER' : 'TENANT';
    targetAdmin.role = fallbackRole;
    targetAdmin.isSuperAdmin = false;
    targetAdmin.adminSuspended = false;
    await targetAdmin.save();

    res.status(200).json({
      success: true,
      message: `Admin privileges revoked for ${targetAdmin.email}. Role transitioned to ${fallbackRole}.`,
      data: {
        _id: targetAdmin._id,
        email: targetAdmin.email,
        role: targetAdmin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
