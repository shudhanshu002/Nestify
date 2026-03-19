import * as chatService from '../services/chat.service.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { propertyId, receiverId, text } = req.body;
    const senderId = req.user._id;

    // Validation check before calling service
    if (!propertyId || !receiverId || !text) {
      const error = new Error('Please provide propertyId, receiverId and text');
      error.statusCode = 400;
      return next(error);
    }

    if (senderId.toString() === receiverId.toString()) {
      const error = new Error('You cannot send a message to yourself');
      error.statusCode = 400;
      return next(error);
    }

    const message = await chatService.sendMessage(senderId, propertyId, receiverId, text);
    
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

export const getMyChats = async (req, res, next) => {
  try {
    const chats = await chatService.getConversationsForUser(req.user._id);
    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (error) {
    next(error);
  }
};