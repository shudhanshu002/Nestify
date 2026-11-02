import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Maintenance from '../src/models/maintenance.model.js';
import PropertyVisit from '../src/models/visit.model.js';

describe('Maintenance Tickets & Property Visits Suite', () => {
  const dummyPropId = new mongoose.Types.ObjectId();
  const dummyUserId = new mongoose.Types.ObjectId();
  const dummyOwnerId = new mongoose.Types.ObjectId();

  describe('Maintenance Ticket Schema Validation', () => {
    it('should validate a complete and valid maintenance ticket', () => {
      const ticket = new Maintenance({
        property: dummyPropId,
        tenant: dummyUserId,
        issueType: 'PLUMBING',
        description: 'Bathroom pipe is leaking water in room 204',
        priority: 'HIGH',
        status: 'OPEN'
      });

      const err = ticket.validateSync();
      expect(err).toBeUndefined();
      expect(ticket.issueType).toBe('PLUMBING');
      expect(ticket.priority).toBe('HIGH');
      expect(ticket.status).toBe('OPEN');
    });

    it('should reject invalid issueType enum', () => {
      const ticket = new Maintenance({
        property: dummyPropId,
        tenant: dummyUserId,
        issueType: 'ASTRONOMY_ISSUE', // Invalid enum
        description: 'Telescope broke',
        priority: 'LOW'
      });

      const err = ticket.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.issueType).toBeDefined();
    });

    it('should reject invalid priority enum', () => {
      const ticket = new Maintenance({
        property: dummyPropId,
        tenant: dummyUserId,
        issueType: 'WIFI',
        description: 'No internet connection',
        priority: 'CRITICAL_MAX' // Invalid enum
      });

      const err = ticket.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.priority).toBeDefined();
    });

    it('should enforce user rating bounds between 1 and 5', () => {
      const validTicket = new Maintenance({
        property: dummyPropId,
        tenant: dummyUserId,
        issueType: 'ELECTRIC',
        description: 'Switchboard sparking',
        userRating: 5
      });
      expect(validTicket.validateSync()).toBeUndefined();

      const invalidTicket = new Maintenance({
        property: dummyPropId,
        tenant: dummyUserId,
        issueType: 'ELECTRIC',
        description: 'Switchboard sparking',
        userRating: 10 // Out of bounds
      });
      expect(invalidTicket.validateSync()).toBeDefined();
    });
  });

  describe('Property Visit Schema Validation', () => {
    it('should validate a scheduled property visit', () => {
      const visit = new PropertyVisit({
        property: dummyPropId,
        visitor: dummyUserId,
        owner: dummyOwnerId,
        visitDate: new Date(Date.now() + 2 * 86400000),
        status: 'PENDING',
        notes: 'Interested in single occupancy room'
      });

      const err = visit.validateSync();
      expect(err).toBeUndefined();
      expect(visit.status).toBe('PENDING');
    });

    it('should require property, visitor, owner, and visitDate', () => {
      const visit = new PropertyVisit({});
      const err = visit.validateSync();

      expect(err).toBeDefined();
      expect(err.errors.property).toBeDefined();
      expect(err.errors.visitor).toBeDefined();
      expect(err.errors.owner).toBeDefined();
      expect(err.errors.visitDate).toBeDefined();
    });

    it('should allow valid status values (PENDING, APPROVED, COMPLETED, CANCELLED)', () => {
      const statuses = ['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'];
      statuses.forEach(status => {
        const visit = new PropertyVisit({
          property: dummyPropId,
          visitor: dummyUserId,
          owner: dummyOwnerId,
          visitDate: new Date(),
          status
        });
        expect(visit.validateSync()).toBeUndefined();
      });
    });
  });
});
