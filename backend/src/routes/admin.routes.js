import express from 'express';
// 󾠮 IMPORTANT: Added missing Property import
import Property from '../models/property.model.js'; 
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