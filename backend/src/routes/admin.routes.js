import express from 'express';
import Property from '../models/property.model.js'; 
import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import Maintenance from '../models/maintenance.model.js';
import Notification from '../models/notification.model.js';
import { resolveDispute, getSystemActivity } from '../services/admin.service.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

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

router.patch('/verify-property/:id', async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id, 
      { isVerified: true, verificationBadge: req.body.badge || 'BRONZE' },
      { new: true }
    );
    res.json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
});

export default router;
