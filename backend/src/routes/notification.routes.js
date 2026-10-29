import express from 'express';
import { getUnreadCount, getNotifications, markAllAsRead } from '../controllers/notification.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // All notification routes require login

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-read', markAllAsRead);

export default router;