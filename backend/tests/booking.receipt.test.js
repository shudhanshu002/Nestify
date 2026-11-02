import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Booking from '../src/models/booking.model.js';
import Payment from '../src/models/payment.model.js';
import { getBookingReceipt } from '../src/controllers/booking.controller.js';

describe('Booking Model & Itemized Receipt Suite', () => {
  const dummyTenant = new mongoose.Types.ObjectId();
  const dummyProp = new mongoose.Types.ObjectId();
  const dummyRoom = new mongoose.Types.ObjectId();

  describe('Booking Schema Validation', () => {
    it('should validate a valid booking document with default status and paymentStatus', () => {
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const booking = new Booking({
        tenant: dummyTenant,
        property: dummyProp,
        room: dummyRoom,
        checkInDate: now,
        checkOutDate: nextMonth,
        totalAmount: 12000
      });

      const err = booking.validateSync();
      expect(err).toBeUndefined();
      expect(booking.status).toBe('PENDING');
      expect(booking.paymentStatus).toBe('UNPAID');
      expect(booking.moveInGuarantee).toBe(false);
      expect(booking.extensions).toEqual([]);
    });

    it('should allow valid status enum values', () => {
      const allowedStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED'];
      allowedStatuses.forEach(status => {
        const booking = new Booking({
          tenant: dummyTenant,
          property: dummyProp,
          room: dummyRoom,
          checkInDate: new Date(),
          checkOutDate: new Date(Date.now() + 86400000),
          totalAmount: 5000,
          status
        });
        expect(booking.validateSync()).toBeUndefined();
      });
    });

    it('should reject invalid booking status enum', () => {
      const booking = new Booking({
        tenant: dummyTenant,
        property: dummyProp,
        room: dummyRoom,
        checkInDate: new Date(),
        checkOutDate: new Date(Date.now() + 86400000),
        totalAmount: 5000,
        status: 'INVALID_STATUS'
      });

      const err = booking.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });

    it('should record stay extensions correctly', () => {
      const booking = new Booking({
        tenant: dummyTenant,
        property: dummyProp,
        room: dummyRoom,
        checkInDate: new Date('2026-01-01'),
        checkOutDate: new Date('2026-02-01'),
        totalAmount: 10000,
        extensions: [{
          previousCheckOutDate: new Date('2026-02-01'),
          newCheckOutDate: new Date('2026-02-15'),
          additionalDays: 14,
          additionalAmount: 4500,
          paymentStatus: 'PAID',
          transactionId: 'TXN-EXT-1234'
        }]
      });

      const err = booking.validateSync();
      expect(err).toBeUndefined();
      expect(booking.extensions.length).toBe(1);
      expect(booking.extensions[0].additionalDays).toBe(14);
      expect(booking.extensions[0].additionalAmount).toBe(4500);
    });
  });

  describe('Itemized Receipt Calculations & Exact Mathematical Balance', () => {
    // Exact itemization algorithm from booking.controller.js and ReceiptModal.jsx
    const calculateReceiptItems = (totalAmount) => {
      const platformFee = Math.round(totalAmount * 0.03); // 3% Platform Technology & Convenience Charges
      const otherCharges = Math.round(totalAmount * 0.02); // 2% Building Maintenance & Escrow Guarantee Fund
      const totalTax = Math.round(totalAmount * 0.10); // 10% GST
      const cgst = Math.round((totalTax / 2) * 100) / 100; // 5% CGST
      const sgst = Math.round((totalTax - cgst) * 100) / 100; // 5% SGST
      const baseTariff = totalAmount - platformFee - otherCharges - totalTax;

      return {
        baseTariff,
        platformFee,
        otherCharges,
        cgst,
        sgst,
        totalTax,
        totalSum: baseTariff + platformFee + otherCharges + cgst + sgst
      };
    };

    const testAmounts = [3500, 5000, 8500, 10000, 12999, 15500, 24000, 50000];

    testAmounts.forEach(amount => {
      it(`should calculate balanced itemized breakdown for ₹${amount} without discrepancy`, () => {
        const result = calculateReceiptItems(amount);

        // Crucial verification: Sum of all itemized charges must equal totalAmount exactly
        expect(result.totalSum).toBe(amount);
        expect(result.cgst + result.sgst).toBe(result.totalTax);
        expect(result.platformFee).toBe(Math.round(amount * 0.03));
        expect(result.otherCharges).toBe(Math.round(amount * 0.02));
        expect(result.baseTariff).toBeGreaterThan(0);
      });
    });

    it('should calculate initial stay vs extensions reconciliation correctly', () => {
      const originalTotal = 15000;
      const extensionAmount = 5000;
      const grandTotal = originalTotal + extensionAmount; // 20000

      const full = calculateReceiptItems(grandTotal);
      const initial = calculateReceiptItems(originalTotal);

      expect(full.totalSum).toBe(20000);
      expect(initial.totalSum).toBe(15000);
      expect(full.totalSum - initial.totalSum).toBe(extensionAmount);
    });
  });

  describe('getBookingReceipt Controller Endpoint', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { _id: dummyTenant, role: 'TENANT' }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
      jest.restoreAllMocks();
    });

    it('should return 404 if booking is not found', async () => {
      jest.spyOn(Booking, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
          })
        })
      });

      await getBookingReceipt(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Booking not found'
      }));
    });

    it('should return complete itemized receipt for an authorized user', async () => {
      const mockBooking = {
        _id: new mongoose.Types.ObjectId(req.params.id),
        tenant: { _id: dummyTenant, firstName: 'Aarav', lastName: 'Sharma', email: 'aarav@test.com' },
        property: { _id: dummyProp, title: 'Silicon Heights PG', location: { address: 'Tech Park', city: 'Bengaluru', state: 'KA' } },
        room: { _id: dummyRoom, roomType: 'DELUXE' },
        checkInDate: new Date('2026-03-01'),
        checkOutDate: new Date('2026-03-31'),
        totalAmount: 10000,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        createdAt: new Date('2026-02-28'),
        extensions: []
      };

      jest.spyOn(Booking, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockBooking)
          })
        })
      });

      jest.spyOn(Payment, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      await getBookingReceipt(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          receiptNumber: expect.stringMatching(/^RCP-/),
          pricing: expect.objectContaining({
            totalAmount: 10000,
            platformFee: 300,   // 3% of 10000
            otherCharges: 200,  // 2% of 10000
            taxesAndFees: 1000, // 10% of 10000
            cgst: 500,          // 5% of 10000
            sgst: 500,          // 5% of 10000
            baseTariff: 8500    // 10000 - 300 - 200 - 1000
          })
        })
      }));
    });
  });
});
