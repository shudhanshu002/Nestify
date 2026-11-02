import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import User from '../src/models/user.model.js';
import Notification from '../src/models/notification.model.js';
import { selectOwnerDeal, verifyUser } from '../src/controllers/user.controller.js';

describe('Commercial Partnership Deals & Agreements Suite', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: {},
      app: { get: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() }) }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.restoreAllMocks();
  });

  describe('User Deal Subschema Validation', () => {
    it('should default deal status to NOT_ELIGIBLE and type to COMMISSION_PERCENTAGE', () => {
      const user = new User({
        firstName: 'Owner',
        email: 'owner@example.com',
        role: 'OWNER'
      });

      expect(user.deal.status).toBe('NOT_ELIGIBLE');
      expect(user.deal.dealType).toBe('COMMISSION_PERCENTAGE');
      expect(user.deal.annualTokenAmount).toBe(9999);
      expect(user.deal.commissionRate).toBe(6);
    });

    it('should allow valid deal types and statuses', () => {
      const user = new User({
        firstName: 'Owner',
        email: 'owner@example.com',
        role: 'OWNER',
        deal: {
          status: 'ACTIVE',
          dealType: 'ANNUAL_TOKEN',
          annualTokenAmount: 14999,
          commissionRate: 0,
          agreementReference: 'AGR-ANN-TEST-1234',
          termsAccepted: true
        }
      });

      const err = user.validateSync();
      expect(err).toBeUndefined();
      expect(user.deal.status).toBe('ACTIVE');
      expect(user.deal.dealType).toBe('ANNUAL_TOKEN');
      expect(user.deal.annualTokenAmount).toBe(14999);
    });

    it('should reject invalid deal status enum', () => {
      const user = new User({
        firstName: 'Owner',
        email: 'owner@example.com',
        deal: {
          status: 'INVALID_STATUS'
        }
      });

      const err = user.validateSync();
      expect(err).toBeDefined();
      expect(err.errors['deal.status']).toBeDefined();
    });
  });

  describe('selectOwnerDeal Controller Logic', () => {
    it('should reject deal selection if owner KYC is not VERIFIED with 403 Forbidden', async () => {
      req.user = { _id: '660000000000000000000001', role: 'OWNER' };
      req.body = { dealType: 'ANNUAL_TOKEN', termsAccepted: true };

      const mockOwner = {
        _id: req.user._id,
        role: 'OWNER',
        kycStatus: 'PENDING',
        deal: { status: 'NOT_ELIGIBLE' }
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockOwner);

      await selectOwnerDeal(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/KYC.*must be approved/i)
      }));
    });

    it('should reject invalid deal plan with 400 Bad Request', async () => {
      req.user = { _id: '660000000000000000000001', role: 'OWNER' };
      req.body = { dealType: 'NON_EXISTENT_PLAN' };

      const mockOwner = {
        _id: req.user._id,
        role: 'OWNER',
        kycStatus: 'VERIFIED',
        deal: { status: 'PENDING_SELECTION' }
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockOwner);

      await selectOwnerDeal(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Invalid plan selected/i)
      }));
    });

    it('should successfully seal Annual Token agreement with unique ref and 1 year validity', async () => {
      req.user = { _id: '660000000000000000000001', role: 'OWNER', firstName: 'Harish' };
      req.body = {
        dealType: 'ANNUAL_TOKEN',
        signatureName: 'Harish Patel'
      };

      const mockOwner = {
        _id: req.user._id,
        firstName: 'Harish',
        role: 'OWNER',
        kycStatus: 'VERIFIED',
        deal: { annualTokenAmount: 9999, commissionRate: 6 },
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockOwner);
      const notificationCreateSpy = jest.spyOn(Notification, 'create').mockResolvedValue({ _id: 'notif_1' });

      await selectOwnerDeal(req, res, next);

      expect(mockOwner.deal.status).toBe('ACTIVE');
      expect(mockOwner.deal.dealType).toBe('ANNUAL_TOKEN');
      expect(mockOwner.deal.agreementReference).toMatch(/^NEST-AGR-/);
      expect(mockOwner.deal.termsAccepted).toBe(true);
      expect(mockOwner.deal.signatureName).toBe('Harish Patel');
      expect(mockOwner.save).toHaveBeenCalled();

      // Check notification created with COMMERCIAL_DEAL type
      expect(notificationCreateSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'COMMERCIAL_DEAL',
        recipient: mockOwner._id
      }));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringMatching(/executed successfully/i)
      }));
    });

    it('should successfully seal Pay-As-You-Earn Commission deal', async () => {
      req.user = { _id: '660000000000000000000002', role: 'OWNER', firstName: 'Priya' };
      req.body = {
        dealType: 'COMMISSION_PERCENTAGE',
        signatureName: 'Priya Sharma'
      };

      const mockOwner = {
        _id: req.user._id,
        firstName: 'Priya',
        role: 'OWNER',
        kycStatus: 'VERIFIED',
        deal: { annualTokenAmount: 9999, commissionRate: 6 },
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockOwner);
      jest.spyOn(Notification, 'create').mockResolvedValue({ _id: 'notif_2' });

      await selectOwnerDeal(req, res, next);

      expect(mockOwner.deal.status).toBe('ACTIVE');
      expect(mockOwner.deal.dealType).toBe('COMMISSION_PERCENTAGE');
      expect(mockOwner.deal.agreementReference).toMatch(/^NEST-AGR-/);
      expect(mockOwner.deal.commissionRate).toBe(6);
      expect(mockOwner.save).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('KYC Status Gate & Verification Transitions', () => {
    it('should update deal status to PENDING_SELECTION upon KYC approval for OWNER', async () => {
      req.params = { id: '660000000000000000000003' };
      req.body = { status: 'VERIFIED' };

      const mockUser = {
        _id: req.params.id,
        role: 'OWNER',
        kycStatus: 'PENDING',
        deal: { status: 'NOT_ELIGIBLE' },
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(Notification, 'create').mockResolvedValue({ _id: 'notif_3' });

      await verifyUser(req, res, next);

      expect(mockUser.kycStatus).toBe('VERIFIED');
      expect(mockUser.deal.status).toBe('PENDING_SELECTION');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should set deal status to NOT_ELIGIBLE upon KYC rejection', async () => {
      req.params = { id: '660000000000000000000004' };
      req.body = { status: 'REJECTED', reason: 'Blurry document' };

      const mockUser = {
        _id: req.params.id,
        role: 'OWNER',
        kycStatus: 'PENDING',
        deal: { status: 'PENDING_SELECTION' },
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(Notification, 'create').mockResolvedValue({ _id: 'notif_4' });

      await verifyUser(req, res, next);

      expect(mockUser.kycStatus).toBe('REJECTED');
      expect(mockUser.deal.status).toBe('NOT_ELIGIBLE');
      expect(mockUser.kycRejectionReason).toBe('Blurry document');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
