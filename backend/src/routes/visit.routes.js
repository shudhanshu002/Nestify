import express from 'express';
import { scheduleVisit, updateVisitStatus } from '../controllers/visit.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', scheduleVisit);
router.patch('/:id/status', updateVisitStatus);

// THE CRITICAL EXPORT
export default router;