import Message from './models/message.model.js';
import { markMessagesAsRead, markMessagesAsDelivered } from './services/chat.service.js';

export const initSocket = (io) => {
  // Map of userId string -> Set of socket IDs
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    let currentUserId = null;

    // Identity Setup
    socket.on('setup', async (userId) => {
      if (!userId) return;
      currentUserId = userId.toString();
      socket.join(currentUserId);

      // Track online status
      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, new Set());
      }
      onlineUsers.get(currentUserId).add(socket.id);

      // Deliver any pending messages now that user is online
      try {
        await markMessagesAsDelivered(currentUserId);
        // Notify senders that messages are delivered (double grey tick)
        socket.broadcast.emit('user_online', { userId: currentUserId });
        socket.broadcast.emit('messages_delivered', { recipientId: currentUserId });
      } catch (err) {
        console.error("Socket setup delivery error:", err.message);
      }
    });

    // Chat Room Join
    socket.on('join_room', (roomId) => {
      if (roomId) socket.join(roomId);
    });

    // Real-time Notification unread count sync
    socket.on('notification_read', ({ userId }) => {
      const targetUser = (userId || currentUserId)?.toString();
      if (targetUser) {
        io.to(targetUser).emit('unread_notification_count_changed');
      }
    });

    // Messaging
    socket.on('send_message', async (payload) => {
      // payload: { _id, sender, receiverId, text, conversation, ... }
      if (!payload || !payload.receiverId) return;

      const receiverId = payload.receiverId.toString();
      const senderId = (payload.sender?._id || payload.sender || currentUserId)?.toString();
      const isReceiverOnline = onlineUsers.has(receiverId) && onlineUsers.get(receiverId).size > 0;

      let finalStatus = 'SENT';

      if (isReceiverOnline) {
        finalStatus = 'DELIVERED';
        if (payload._id) {
          await Message.findByIdAndUpdate(payload._id, {
            status: 'DELIVERED',
            deliveredAt: new Date()
          }).catch(() => {});
        }

        // Notify sender immediately: delivered (double grey tick)
        if (senderId) {
          io.to(senderId).emit('message_delivered', {
            messageId: payload._id,
            conversationId: payload.conversation
          });
        }
      }

      // Emit to receiver's private room
      io.to(receiverId).emit('message_received', {
        ...payload,
        status: finalStatus
      });
    });

    // Client acknowledges delivery
    socket.on('acknowledge_delivery', async ({ messageId, conversationId, senderId }) => {
      if (messageId) {
        await Message.findByIdAndUpdate(messageId, {
          status: 'DELIVERED',
          deliveredAt: new Date()
        }).catch(() => {});
      }
      if (senderId) {
        io.to(senderId.toString()).emit('message_delivered', {
          messageId,
          conversationId
        });
      }
    });

    // Read Receipt (Double Blue Tick)
    socket.on('mark_as_read', async ({ conversationId, userId, receiverId }) => {
      if (!conversationId || !userId) return;

      try {
        await markMessagesAsRead(conversationId, userId);

        // Notify the other participant that messages in this conversation were read
        if (receiverId) {
          io.to(receiverId.toString()).emit('messages_read', {
            conversationId,
            readerId: userId
          });
        }

        // Also emit to conversation room in case both are in room
        socket.to(conversationId).emit('messages_read', {
          conversationId,
          readerId: userId
        });
      } catch (err) {
        console.error("mark_as_read error:", err.message);
      }
    });

    socket.on('disconnect', () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSockets = onlineUsers.get(currentUserId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(currentUserId);
          socket.broadcast.emit('user_offline', { userId: currentUserId });
        }
      }
    });
  });
};
