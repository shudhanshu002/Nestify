import express from 'express';
import { scheduleVisit, updateVisitStatus } from '../controllers/visit.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { interactionLimiter } from '../middlewares/security.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', interactionLimiter, scheduleVisit);
router.patch('/:id/status', updateVisitStatus);

export default router;
