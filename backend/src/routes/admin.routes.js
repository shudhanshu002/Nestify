import express from 'express';
import { resolveDispute, getSystemActivity } from '../services/admin.service.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Only Admins can access these
router.use(protect, authorize('ADMIN'));

router.get('/dashboard', async (req, res) => {
  const stats = await getSystemActivity();
  res.json(stats);
});

router.put('/disputes/:id/resolve', async (req, res) => {
  const resolved = await resolveDispute(req.params.id, req.body, req.user._id);
  res.json(resolved);
});

export default router;