import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Room from '../src/models/room.model.js';
import Booking from '../src/models/booking.model.js';
import { lockRoomForBooking, confirmBooking } from '../src/services/booking.service.js';

describe('Room Model & Booking Concurrency Lock Service Suite', () => {
  const dummyPropId = new mongoose.Types.ObjectId();
  const dummyTenantId = new mongoose.Types.ObjectId();
  const dummyRoomId = new mongoose.Types.ObjectId();

  describe('Room Schema Validation', () => {
    it('should validate valid room configuration', () => {
      const room = new Room({
        property: dummyPropId,
        roomType: 'DELUXE',
        basePrice: 6500,
        totalInventory: 5,
        availableInventory: 5,
        capacity: 2
      });

      const err = room.validateSync();
      expect(err).toBeUndefined();
      expect(room.roomType).toBe('DELUXE');
      expect(room.totalInventory).toBe(5);
    });

    it('should reject invalid roomType enum', () => {
      const room = new Room({
        property: dummyPropId,
        roomType: 'PENTHOUSE_MEGA', // Invalid enum
        basePrice: 12000,
        totalInventory: 1,
        availableInventory: 1
      });

      const err = room.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.roomType).toBeDefined();
    });

    it('should require property reference and basePrice', () => {
      const room = new Room({});
      const err = room.validateSync();

      expect(err).toBeDefined();
      expect(err.errors.property).toBeDefined();
      expect(err.errors.basePrice).toBeDefined();
    });
  });

  describe('Concurrency Lock Service (lockRoomForBooking)', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it('should lock an available room and set a 5-minute timeout', async () => {
      const mockRoom = {
        _id: dummyRoomId,
        availableInventory: 2,
        isLocked: false,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Room, 'findById').mockResolvedValue(mockRoom);

      const lockedRoom = await lockRoomForBooking(dummyRoomId);

      expect(lockedRoom.isLocked).toBe(true);
      expect(lockedRoom.lockTimeout).toBeInstanceOf(Date);
      expect(lockedRoom.lockTimeout.getTime()).toBeGreaterThan(Date.now() + 4 * 60 * 1000);
      expect(mockRoom.save).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the room is currently locked (race condition prevention)', async () => {
      const mockRoom = {
        _id: dummyRoomId,
        availableInventory: 2,
        isLocked: true, // Already locked by another thread/request
        lockTimeout: new Date(Date.now() + 3 * 60 * 1000)
      };

      jest.spyOn(Room, 'findById').mockResolvedValue(mockRoom);

      await expect(lockRoomForBooking(dummyRoomId)).rejects.toThrow(
        /currently unavailable or being booked by another user/i
      );
    });

    it('should throw an error if the room has 0 available inventory', async () => {
      const mockRoom = {
        _id: dummyRoomId,
        availableInventory: 0,
        isLocked: false
      };

      jest.spyOn(Room, 'findById').mockResolvedValue(mockRoom);

      await expect(lockRoomForBooking(dummyRoomId)).rejects.toThrow(
        /currently unavailable or being booked by another user/i
      );
    });
  });

  describe('Booking Confirmation & Release (confirmBooking)', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it('should create confirmed booking, decrement inventory, and release lock', async () => {
      const bookingData = {
        roomId: dummyRoomId,
        tenantId: dummyTenantId,
        propertyId: dummyPropId,
        amount: 8500
      };

      const mockCreatedBooking = {
        _id: new mongoose.Types.ObjectId(),
        tenant: dummyTenantId,
        property: dummyPropId,
        room: dummyRoomId,
        totalAmount: 8500,
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      };

      jest.spyOn(Booking, 'create').mockResolvedValue(mockCreatedBooking);
      const updateSpy = jest.spyOn(Room, 'findByIdAndUpdate').mockResolvedValue({ _id: dummyRoomId });

      const result = await confirmBooking(bookingData);

      expect(result.status).toBe('CONFIRMED');
      expect(result.totalAmount).toBe(8500);

      // Verify inventory decrement and lock release
      expect(updateSpy).toHaveBeenCalledWith(
        dummyRoomId,
        expect.objectContaining({
          $inc: { availableInventory: -1 },
          $set: { isLocked: false, lockTimeout: null }
        })
      );
    });
  });
});
