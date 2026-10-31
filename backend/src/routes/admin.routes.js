import express from 'express';
import Property from '../models/property.model.js'; 
import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import { resolveDispute, getSystemActivity } from '../services/admin.service.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Only Admins can access these - applies to every route below
router.use(protect, authorize('ADMIN'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const stats = await getSystemActivity();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all owners along with their listed PGs, rooms, and ratings
// @route   GET /api/v1/admin/owners-directory
router.get('/owners-directory', async (req, res, next) => {
  try {
    // 1. Fetch all owners (users with role OWNER, COMPANY_ADMIN, or COMPANY_MANAGER)
    const owners = await User.find({ 
      role: { $in: ['OWNER', 'COMPANY_ADMIN', 'COMPANY_MANAGER'] } 
    }).select('-password').sort('-createdAt');

    const ownerIds = owners.map(o => o._id);

    // 2. Fetch all properties listed by these owners
    const properties = await Property.find({ 
      owner: { $in: ownerIds } 
    }).populate('owner', 'firstName lastName email avatar phone').sort('-createdAt');

    const propertyIds = properties.map(p => p._id);

    // 3. Fetch all rooms for these properties
    const rooms = await Room.find({ 
      property: { $in: propertyIds } 
    });

    // 4. Map properties and rooms to each owner
    const ownersData = owners.map(owner => {
      const ownerObj = owner.toObject();
      const ownerProperties = properties
        .filter(p => (p.owner?._id || p.owner).toString() === owner._id.toString())
        .map(p => {
          const propObj = p.toObject();
          propObj.rooms = rooms.filter(r => r.property.toString() === p._id.toString());
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
      data: ownersData
    });
  } catch (error) {
    next(error);
  }
});

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
