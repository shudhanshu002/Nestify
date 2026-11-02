import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Property from '../src/models/property.model.js';

describe('Property & Inventory Management Suite', () => {
  const dummyOwnerId = new mongoose.Types.ObjectId();

  describe('Property Schema Validation', () => {
    it('should validate a complete, valid property document', () => {
      const validProperty = new Property({
        title: 'Nestify Prime Co-Living',
        description: 'Luxury co-living space with high speed wifi and 24/7 security',
        category: 'PG',
        owner: dummyOwnerId,
        location: {
          address: '42 Silicon Highway',
          city: 'Bengaluru',
          state: 'Karnataka',
          coordinates: {
            type: 'Point',
            coordinates: [77.5946, 12.9716] // [lng, lat]
          }
        },
        amenities: ['WIFI', 'AC', 'FOOD', 'POWER_BACKUP'],
        genderPreference: 'UNISEX',
        tier: 'FLAGSHIP',
        basePrice: 8500,
        safetyMetrics: {
          cctv: true,
          powerBackup: true,
          internetSpeed: '200 Mbps',
          noiseLevel: 'Low'
        }
      });

      const err = validProperty.validateSync();
      expect(err).toBeUndefined();
      expect(validProperty.category).toBe('PG');
      expect(validProperty.tier).toBe('FLAGSHIP');
      expect(validProperty.verificationStatus).toBe('PENDING');
      expect(validProperty.safetyMetrics.cctv).toBe(true);
    });

    it('should reject property if category is not in allowed enum', () => {
      const invalidCategoryProp = new Property({
        title: 'Invalid Category Property',
        description: 'Test',
        category: 'VILLA_RESORT', // Not allowed
        owner: dummyOwnerId,
        location: {
          address: 'Test Rd',
          city: 'Delhi',
          state: 'DL',
          coordinates: { type: 'Point', coordinates: [77.1, 28.6] }
        }
      });

      const err = invalidCategoryProp.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.category).toBeDefined();
    });

    it('should reject property with invalid coordinates (missing Point coordinates)', () => {
      const invalidGeoProp = new Property({
        title: 'Invalid Geo',
        description: 'Test',
        category: 'PG',
        owner: dummyOwnerId,
        location: {
          address: 'Test Rd',
          city: 'Pune',
          state: 'MH',
          coordinates: { type: 'Point', coordinates: [] } // Empty coordinates
        }
      });

      const err = invalidGeoProp.validateSync();
      expect(err).toBeDefined();
      expect(err.errors['location.coordinates.coordinates']).toBeDefined();
    });

    it('should enforce tier enum (FLAGSHIP, LUXURY, BUDGET, STANDARD)', () => {
      const validTier = new Property({
        title: 'Budget Stay',
        description: 'Affordable stay',
        category: 'Hostel',
        owner: dummyOwnerId,
        location: {
          address: 'Station Rd',
          city: 'Jaipur',
          state: 'RJ',
          coordinates: { type: 'Point', coordinates: [75.8, 26.9] }
        },
        tier: 'BUDGET'
      });
      expect(validTier.validateSync()).toBeUndefined();

      validTier.tier = 'ULTRA_PLATINUM'; // Invalid
      const err = validTier.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.tier).toBeDefined();
    });

    it('should enforce verificationStatus enum (PENDING, VERIFIED, REJECTED)', () => {
      const prop = new Property({
        title: 'Status Test',
        description: 'Status check',
        category: 'PG',
        owner: dummyOwnerId,
        location: {
          address: 'Street 1',
          city: 'Noida',
          state: 'UP',
          coordinates: { type: 'Point', coordinates: [77.3, 28.5] }
        },
        verificationStatus: 'VERIFIED'
      });
      expect(prop.validateSync()).toBeUndefined();

      prop.verificationStatus = 'UNKNOWN_STATUS';
      expect(prop.validateSync()).toBeDefined();
    });
  });

  describe('Search & Filter Query Logic Simulation', () => {
    it('should build proper filtering criteria for city, category, and budget', () => {
      const queryParams = {
        city: 'Bengaluru',
        category: 'PG',
        maxPrice: '10000',
        tier: 'FLAGSHIP',
        gender: 'FEMALE'
      };

      const filter = {};
      if (queryParams.city) {
        filter['location.city'] = new RegExp(queryParams.city, 'i');
      }
      if (queryParams.category) {
        filter.category = queryParams.category;
      }
      if (queryParams.maxPrice) {
        filter.basePrice = { $lte: Number(queryParams.maxPrice) };
      }
      if (queryParams.tier) {
        filter.tier = queryParams.tier;
      }
      if (queryParams.gender) {
        filter.genderPreference = { $in: [queryParams.gender, 'UNISEX'] };
      }

      expect(filter['location.city']).toEqual(/Bengaluru/i);
      expect(filter.category).toBe('PG');
      expect(filter.basePrice.$lte).toBe(10000);
      expect(filter.tier).toBe('FLAGSHIP');
      expect(filter.genderPreference.$in).toContain('FEMALE');
      expect(filter.genderPreference.$in).toContain('UNISEX');
    });
  });
});
