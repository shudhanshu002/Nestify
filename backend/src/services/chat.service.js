import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';

/**
 * Logic to detect phone numbers or emails to prevent platform bypass
 */
const privacyEngineCheck = (text) => {
  const phoneRegex = /(\+?\d{1,4}[\s-]?)?(\(?\d{3}\)?[\s-]?)?[\d\s-]{7,10}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return phoneRegex.test(text) || emailRegex.test(text);
};

export const sendMessage = async (senderId, propertyId, receiverId, text) => {
  // 1. Find or Create Conversation
  let conversation = await Conversation.findOne({
    property: propertyId,
    participants: { $all: [senderId, receiverId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      property: propertyId,
      participants: [senderId, receiverId]
    });
  }

  // 2. Run Safety/Privacy Check
  const containsContactInfo = privacyEngineCheck(text);

  // 3. Create Message
  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    text,
    containsContactInfo
  });

  // 4. Update Conversation metadata for the list view
  conversation.lastMessage = text;
  conversation.lastMessageAt = Date.now();
  await conversation.save();

  return message;
};

export const getConversationsForUser = async (userId) => {
  return await Conversation.find({ participants: userId })
    .populate('participants', 'firstName lastName profile.avatar')
    .populate('property', 'title images')
    .sort({ lastMessageAt: -1 });
};