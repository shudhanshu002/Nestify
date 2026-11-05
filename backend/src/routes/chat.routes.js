import express from 'express';
import { 
  startChat, 
  fetchMyChats, 
  fetchMessages, 
  sendMessage, 
  getAdminDirectory,
  markAsRead,
  getUnreadCount
} from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { chatLimiter } from '../middlewares/security.middleware.js';

const router = express.Router();
router.use(protect);

router.post('/access', startChat);
router.post('/send', chatLimiter, sendMessage);
router.get('/my-chats', fetchMyChats);
router.get('/history/:chatId', fetchMessages);
router.patch('/read/:chatId', markAsRead);
router.get('/unread-count', getUnreadCount);
router.get('/admin/directory', getAdminDirectory);

export default router;
