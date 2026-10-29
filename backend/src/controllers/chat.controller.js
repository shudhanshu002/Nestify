import * as chatService from '../services/chat.service.js';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';

export const startChat = async (req, res, next) => {
  try {
    const { receiverId, propertyId } = req.body;
    
    const chat = await chatService.createOrAccessChat(req.user._id, receiverId, propertyId);
    
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    console.error("Chat Access Error:", error.message);
    
    // If Admin is missing, return a specific message
    if (error.message.includes("ADMIN_NOT_FOUND")) {
      return res.status(404).json({ success: false, message: "Official Support is currently offline. (Admin user missing in DB)" });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

// ... keep fetchMyChats and fetchMessages as they were

export const fetchMyChats = async (req, res, next) => {
  try {
    const chats = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'firstName lastName avatar role')
      .populate('property', 'title images')
      .sort('-lastMessageAt');

    const sanitizedChats = chats.map(c => {
      const obj = c.toObject();
      if (c.unreadCount instanceof Map) {
        obj.unreadCount = Object.fromEntries(c.unreadCount);
      }
      return obj;
    });

    res.status(200).json({ success: true, data: sanitizedChats });
  } catch (error) { next(error); }
};

export const fetchMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ conversation: req.params.chatId })
      .populate('sender', 'firstName lastName avatar role')
      .sort('createdAt');
    res.status(200).json({ success: true, data: messages });
  } catch (error) { next(error); }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text, propertyId, status } = req.body;
    const senderId = req.user._id;

    if (!text || !receiverId) {
      return res.status(400).json({ success: false, message: "Text and Receiver are required" });
    }

    // 1. Get or Create the room
    const chat = await chatService.createOrAccessChat(senderId, receiverId, propertyId);

    // 2. Save message with status
    const message = await chatService.saveNewMessage(senderId, chat._id, text, status || 'SENT');
    
    // 3. Return the message with the sender details populated
    const populatedMessage = await message.populate('sender', 'firstName lastName avatar role');

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.error("SendMessage Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    await chatService.markMessagesAsRead(chatId, req.user._id);
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) { next(error); }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await chatService.getTotalUnreadCount(req.user._id);
    res.status(200).json({ success: true, count });
  } catch (error) { next(error); }
};




// Add this to your chat controller
export const getAllUsersForAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    // Find all Owners and Tenants, excluding the Admin themselves
    const users = await User.find({ 
      _id: { $ne: req.user._id },
      role: { $in: ['OWNER', 'TENANT'] }
    }).select('firstName lastName role avatar email');

    res.status(200).json({ success: true, data: users });
  } catch (error) { next(error); }
};

// Add this to your chat controller
export const getAdminDirectory = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: "Forbidden" });

    // Fetch all users except the admin themselves
    const users = await User.find({ 
      _id: { $ne: req.user._id },
      role: { $in: ['OWNER', 'TENANT'] } 
    }).select('firstName lastName role avatar email');

    res.status(200).json({ success: true, data: users });
  } catch (error) { next(error); }
};