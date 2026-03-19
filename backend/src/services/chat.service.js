import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';

const privacyEngineCheck = (text) => {
  const phoneRegex = /(\+?\d{1,4}[\s-]?)?(\(?\d{3}\)?[\s-]?)?[\d\s-]{7,10}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return phoneRegex.test(text) || emailRegex.test(text);
};

export const sendMessage = async (senderId, propertyId, receiverId, text) => {
  // Sort IDs so the conversation key is always consistent
  const sortedParticipants = [senderId.toString(), receiverId.toString()].sort();

  // 1. Find or Create Conversation
  let conversation = await Conversation.findOne({
    property: propertyId,
    participants: sortedParticipants
  });

  if (!conversation) {
    conversation = await Conversation.create({
      property: propertyId,
      participants: sortedParticipants
    });
  }

  // 2. Safety Check
  const containsContactInfo = privacyEngineCheck(text);

  // 3. Create Message
  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    text,
    containsContactInfo
  });

  // 4. Update Conversation metadata
  conversation.lastMessage = text;
  conversation.lastMessageAt = Date.now();
  
  // Update unread count for the receiver
  const currentCount = conversation.unreadCount.get(receiverId.toString()) || 0;
  conversation.unreadCount.set(receiverId.toString(), currentCount + 1);
  
  await conversation.save();

  return message;
};

export const getConversationsForUser = async (userId) => {
  return await Conversation.find({ participants: userId })
    .populate('participants', 'firstName lastName')
    .populate('property', 'title images')
    .sort({ lastMessageAt: -1 });
};