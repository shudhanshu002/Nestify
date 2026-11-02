import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Notification from '../src/models/notification.model.js';
import { notFound, errorHandler } from '../src/middlewares/error.middleware.js';

describe('Notification Model & Error Middleware Suite', () => {
  const dummyRecipient = new mongoose.Types.ObjectId();

  describe('Notification Model & Enum Validation', () => {
    it('should validate all supported notification types including COMMERCIAL_DEAL and SYSTEM', () => {
      const validTypes = [
        'COMMERCIAL_DEAL',
        'SYSTEM',
        'KYC_UPDATE',
        'PROPERTY_VERIFICATION',
        'BOOKING',
        'MAINTENANCE',
        'PAYMENT',
        'GENERAL'
      ];

      validTypes.forEach(type => {
        const notif = new Notification({
          recipient: dummyRecipient,
          title: `Test Title for ${type}`,
          message: `Test notification message for ${type}`,
          type
        });

        const err = notif.validateSync();
        expect(err).toBeUndefined();
        expect(notif.type).toBe(type);
      });
    });

    it('should reject invalid notification type', () => {
      const invalidNotif = new Notification({
        recipient: dummyRecipient,
        title: 'Invalid',
        message: 'Invalid type notification',
        type: 'UNAUTHORIZED_SPAM_TYPE'
      });

      const err = invalidNotif.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.type).toBeDefined();
    });

    it('should default type to GENERAL if not specified', () => {
      const defaultNotif = new Notification({
        recipient: dummyRecipient,
        title: 'Default Notification',
        message: 'Hello'
      });

      expect(defaultNotif.type).toBe('GENERAL');
      expect(defaultNotif.isRead).toBe(false);
    });

    it('should require recipient, title, and message', () => {
      const emptyNotif = new Notification({});
      const err = emptyNotif.validateSync();

      expect(err).toBeDefined();
      expect(err.errors.recipient).toBeDefined();
      expect(err.errors.title).toBeDefined();
      expect(err.errors.message).toBeDefined();
    });
  });

  describe('Error Handling Middleware (notFound & errorHandler)', () => {
    let req, res, next;

    beforeEach(() => {
      req = { originalUrl: '/api/v1/non-existent-endpoint' };
      res = {
        statusCode: 200,
        status: jest.fn(function(code) {
          this.statusCode = code;
          return this;
        }),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('should handle notFound by setting status 404 and passing Error to next', () => {
      notFound(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatch(/Not Found - \/api\/v1\/non-existent-endpoint/);
    });

    it('should handle custom status codes in errorHandler (e.g. 403 Forbidden)', () => {
      const error = new Error('Permission denied');
      error.statusCode = 403;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Permission denied'
      }));
    });

    it('should default to 500 if status code is 200', () => {
      const error = new Error('Unexpected database failure');
      res.statusCode = 200;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Unexpected database failure'
      }));
    });

    it('should suppress stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Production error');
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Production error',
        stack: null
      }));

      process.env.NODE_ENV = originalEnv;
    });
  });
});
