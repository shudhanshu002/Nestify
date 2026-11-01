import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import mongoose from 'mongoose';

export const createOrAccessChat = async (senderId, receiverId, propertyId) => {
  let targetId = receiverId;

  // 1. Resolve Admin ID
  if (receiverId === "ADMIN_ROLE_ID" || receiverId === "ADMIN" || receiverId === "support") {
    let admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      admin = await User.findOne({ email: 'support@nestify.com' });
      if (!admin) {
        admin = await User.create({
          firstName: 'Nestify',
          lastName: 'Official Support',
          email: 'support@nestify.com',
          password: 'Password@123',
          role: 'ADMIN',
          kycStatus: 'VERIFIED'
        });
      }
    }
    targetId = admin._id;
  }

  // 2. Validate Target
  if (!mongoose.Types.ObjectId.isValid(targetId)) throw new Error("INVALID_ID");
  if (senderId.toString() === targetId.toString()) throw new Error("SELF_CHAT");

  // 3. Sort IDs so [A, B] is the same as [B, A]
  const sortedParticipants = [senderId.toString(), targetId.toString()].sort();

  // 4. Use $all and $size to find the exact pair
  let chat = await Conversation.findOne({
    participants: { $all: sortedParticipants, $size: 2 },
    property: propertyId || null 
  }).populate('participants', 'firstName lastName role avatar');

  if (!chat) {
    // 5. Create if not found
    chat = await Conversation.create({
      participants: sortedParticipants,
      property: propertyId || null,
    });
    chat = await chat.populate('participants', 'firstName lastName role avatar');
  }

  return chat;
};

export const saveNewMessage = async (senderId, conversationId, text, status = 'SENT') => {
  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text: text.trim(),
    status,
    deliveredAt: status === 'DELIVERED' ? new Date() : null
  });

  // Update conversation lastMessage, lastMessageAt, and increment unreadCount for receiver
  const conv = await Conversation.findById(conversationId);
  if (conv) {
    conv.lastMessage = text.trim();
    conv.lastMessageAt = Date.now();

    if (!conv.unreadCount) {
      conv.unreadCount = new Map();
    }

    conv.participants.forEach(p => {
      const pId = p.toString();
      if (pId !== senderId.toString()) {
        const currentCount = (conv.unreadCount.get ? conv.unreadCount.get(pId) : conv.unreadCount[pId]) || 0;
        if (conv.unreadCount.set) {
          conv.unreadCount.set(pId, currentCount + 1);
        } else {
          conv.unreadCount[pId] = currentCount + 1;
        }
      }
    });

    await conv.save();
  }

  return message;
};

export const markMessagesAsRead = async (conversationId, userId) => {
  const uId = userId.toString();

  // 1. Mark messages from other participants as READ
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      status: { $ne: 'READ' }
    },
    {
      $set: {
        status: 'READ',
        isRead: true,
        readAt: new Date()
      }
    }
  );

  // 2. Reset unreadCount for this user in the conversation
  const conv = await Conversation.findById(conversationId);
  if (conv && conv.unreadCount) {
    if (conv.unreadCount.set) {
      conv.unreadCount.set(uId, 0);
    } else {
      conv.unreadCount[uId] = 0;
    }
    await conv.save();
  }

  return { success: true };
};

export const markMessagesAsDelivered = async (userId, conversationId = null) => {
  const filter = {
    sender: { $ne: userId },
    status: 'SENT'
  };

  if (conversationId) {
    filter.conversation = conversationId;
  } else {
    const convs = await Conversation.find({ participants: userId });
    filter.conversation = { $in: convs.map(c => c._id) };
  }

  await Message.updateMany(
    filter,
    {
      $set: {
        status: 'DELIVERED',
        deliveredAt: new Date()
      }
    }
  );
};

export const getTotalUnreadCount = async (userId) => {
  const uId = userId.toString();
  const convs = await Conversation.find({ participants: userId });
  let total = 0;

  for (const c of convs) {
    if (c.unreadCount) {
      const count = (c.unreadCount.get ? c.unreadCount.get(uId) : c.unreadCount[uId]) || 0;
      total += count;
    }
  }

  return total;
};
