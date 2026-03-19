import express from 'express';
import { sendMessage, getMyChats } from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/send', sendMessage);
router.get('/list', getMyChats);

export default router;