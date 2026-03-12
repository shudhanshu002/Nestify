import express from 'express';
import { sendMessage, getConversationsForUser } from '../services/chat.service.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/send', async (req, res, next) => {
  try {
    const { propertyId, receiverId, text } = req.body;
    const message = await sendMessage(req.user._id, propertyId, receiverId, text);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

router.get('/list', async (req, res, next) => {
  try {
    const chats = await getConversationsForUser(req.user._id);
    res.json(chats);
  } catch (error) {
    next(error);
  }
});

export default router;