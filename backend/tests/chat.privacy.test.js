import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Message from '../src/models/message.model.js';
import Conversation from '../src/models/conversation.model.js';
import { createOrAccessChat, saveNewMessage } from '../src/services/chat.service.js';

describe('Chat System & Privacy / Moderation Engine Suite', () => {
  const dummySenderId = new mongoose.Types.ObjectId();
  const dummyReceiverId = new mongoose.Types.ObjectId();
  const dummyConvId = new mongoose.Types.ObjectId();

  describe('Message Schema & Privacy Pre-Validation Hook', () => {
    it('should flag a message containing a 10-digit Indian phone number', () => {
      const msg = new Message({
        conversation: dummyConvId,
        sender: dummySenderId,
        text: 'Hello, please call me at 9876543210 directly to skip the fee'
      });

      expect(msg.containsContactInfo).toBe(true);
      expect(msg.isFlagged).toBe(true);
    });

    it('should flag a message containing a phone number with country code (+91)', () => {
      const msg = new Message({
        conversation: dummyConvId,
        sender: dummySenderId,
        text: 'Reach me on whatsapp +91 9876543210 for offline booking'
      });

      expect(msg.containsContactInfo).toBe(true);
      expect(msg.isFlagged).toBe(true);
    });

    it('should flag a message containing an email address', () => {
      const msg = new Message({
        conversation: dummyConvId,
        sender: dummySenderId,
        text: 'Send the bank details to my email landlord@properties.in'
      });

      expect(msg.containsContactInfo).toBe(true);
      expect(msg.isFlagged).toBe(true);
    });

    it('should NOT flag normal conversational messages without contact details', () => {
      const cleanMessages = [
        'Hi, is the deluxe room available for immediate move-in?',
        'Does the rent include electricity and 200 Mbps wifi?',
        'Can I schedule a physical visit tomorrow at 4 PM?',
        'Thank you! Looking forward to staying at Nestify.'
      ];

      cleanMessages.forEach(text => {
        const msg = new Message({
          conversation: dummyConvId,
          sender: dummySenderId,
          text
        });

        expect(msg.containsContactInfo).toBe(false);
        expect(msg.isFlagged).toBe(false);
      });
    });

    it('should enforce status enum on Message', () => {
      const validMsg = new Message({
        conversation: dummyConvId,
        sender: dummySenderId,
        text: 'Valid',
        status: 'DELIVERED'
      });
      expect(validMsg.validateSync()).toBeUndefined();

      const invalidMsg = new Message({
        conversation: dummyConvId,
        sender: dummySenderId,
        text: 'Invalid',
        status: 'DISCARDED'
      });
      expect(invalidMsg.validateSync()).toBeDefined();
    });
  });

  describe('Chat Service Logic (createOrAccessChat & saveNewMessage)', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it('should prevent self-chat by throwing SELF_CHAT error', async () => {
      await expect(
        createOrAccessChat(dummySenderId, dummySenderId)
      ).rejects.toThrow('SELF_CHAT');
    });

    it('should throw INVALID_ID if receiverId is not a valid ObjectId or admin keyword', async () => {
      await expect(
        createOrAccessChat(dummySenderId, 'not-a-valid-id')
      ).rejects.toThrow('INVALID_ID');
    });

    it('should populate containsContactInfo in saveNewMessage', async () => {
      const textWithPhone = 'Call me on 9123456789';
      const mockCreatedMessage = {
        _id: new mongoose.Types.ObjectId(),
        conversation: dummyConvId,
        sender: dummySenderId,
        text: textWithPhone,
        status: 'SENT',
        containsContactInfo: true,
        isFlagged: true
      };

      jest.spyOn(Message, 'create').mockResolvedValue(mockCreatedMessage);
      jest.spyOn(Conversation, 'findById').mockResolvedValue(null);

      const saved = await saveNewMessage(dummySenderId, dummyConvId, textWithPhone);

      expect(saved.containsContactInfo).toBe(true);
      expect(saved.isFlagged).toBe(true);
      expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
        containsContactInfo: true,
        isFlagged: true
      }));
    });
  });
});
