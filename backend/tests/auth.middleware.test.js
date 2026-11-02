import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { protect, authorize, isAdmin } from '../src/middlewares/auth.middleware.js';
import User from '../src/models/user.model.js';

describe('Auth Middleware Suite (protect, authorize, isAdmin)', () => {
  const secretKey = 'test_secret_for_middleware';
  process.env.JWT_SECRET = secretKey;

  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      statusCode: 200
    };
    next = jest.fn();
    jest.restoreAllMocks();
  });

  describe('protect middleware', () => {
    it('should return 401 if no authorization header is present', async () => {
      await protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatch(/Not authorized, no token/i);
      expect(error.statusCode).toBe(401);
    });

    it('should return 401 if token is invalid or expired', async () => {
      req.headers.authorization = 'Bearer invalid.token.payload';

      await protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/Not authorized, token failed/i);
      expect(error.statusCode).toBe(401);
    });

    it('should return 401 if user from decoded token is not found in database', async () => {
      const validToken = jwt.sign({ id: '660000000000000000000099' }, secretKey);
      req.headers.authorization = `Bearer ${validToken}`;

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/Not authorized, user not found/i);
      expect(error.statusCode).toBe(401);
    });

    it('should attach user to req and call next with no error when token is valid', async () => {
      const mockUser = {
        _id: '660000000000000000000001',
        firstName: 'Sudhanshu',
        email: 'sudhanshu@test.com',
        role: 'OWNER'
      };
      const validToken = jwt.sign({ id: mockUser._id }, secretKey);
      req.headers.authorization = `Bearer ${validToken}`;

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith(); // called with no error
    });
  });

  describe('authorize middleware', () => {
    it('should deny access (403) if req.user is missing', () => {
      const middleware = authorize('ADMIN');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/not authorized/i);
    });

    it('should deny access (403) if user role does not match allowed roles', () => {
      req.user = { role: 'TENANT' };
      const middleware = authorize('ADMIN', 'OWNER');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/Role TENANT is not authorized/i);
    });

    it('should allow access if user has one of the allowed roles (case-insensitive)', () => {
      req.user = { role: 'owner' };
      const middleware = authorize('ADMIN', 'OWNER');
      middleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('isAdmin middleware', () => {
    it('should grant access if user role is ADMIN', () => {
      req.user = { role: 'ADMIN' };
      isAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access (403) if user is not ADMIN', () => {
      req.user = { role: 'OWNER' };
      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/Matrix access denied/i);
    });
  });
});
