import { describe, it, expect } from '@jest/globals';
import { normalizeIndianPhone, maskPhone } from '../src/services/sms.service.js';
import User from '../src/models/user.model.js';

describe('User Verification System & Telecom/ID Compliance Suite', () => {

  describe('1. Mobile Phone Verification & Indian Telecom Normalization', () => {
    it('should normalize standard 10-digit Indian numbers', () => {
      expect(normalizeIndianPhone('9876543210')).toBe('9876543210');
      expect(normalizeIndianPhone('8765432109')).toBe('8765432109');
      expect(normalizeIndianPhone('7654321098')).toBe('7654321098');
      expect(normalizeIndianPhone('6543210987')).toBe('6543210987');
    });

    it('should strip +91, 91, 0 prefixes, spaces, and hyphens', () => {
      expect(normalizeIndianPhone('+91 98765 43210')).toBe('9876543210');
      expect(normalizeIndianPhone('+91-9876543210')).toBe('9876543210');
      expect(normalizeIndianPhone('09876543210')).toBe('9876543210');
      expect(normalizeIndianPhone('919876543210')).toBe('9876543210');
    });

    it('should reject invalid Indian numbers (starting with 1-5 or wrong length)', () => {
      expect(normalizeIndianPhone('1234567890')).toBeNull();
      expect(normalizeIndianPhone('5555555555')).toBeNull();
      expect(normalizeIndianPhone('98765')).toBeNull();
      expect(normalizeIndianPhone('987654321000')).toBeNull();
      expect(normalizeIndianPhone('')).toBeNull();
      expect(normalizeIndianPhone(null)).toBeNull();
    });

    it('should mask phone number safely preserving privacy', () => {
      expect(maskPhone('9876543210')).toBe('+91 98****3210');
      expect(maskPhone('+91 98765 43210')).toBe('+91 98****3210');
    });
  });

  describe('2. User Model Verification Schema Subdocuments', () => {
    it('should initialize user model with complete verification structures', () => {
      const user = new User({
        firstName: 'Rohan',
        lastName: 'Verma',
        email: 'rohan.verma@example.com',
        phone: '9876543210'
      });

      expect(user.isPhoneVerified).toBe(false);
      expect(user.isEmailVerified).toBe(false);
      expect(user.kycStatus).toBe('NOT_SUBMITTED');
      expect(user.identityVerification).toBeDefined();
      expect(user.selfieVerification).toBeDefined();
      expect(user.selfieVerification.isVerified).toBe(false);
      expect(user.studentOrWorkVerification).toBeDefined();
      expect(user.studentOrWorkVerification.category).toBe('NONE');
    });

    it('should accept verified Aadhaar identity data with masked ID', () => {
      const user = new User({
        firstName: 'Pooja',
        email: 'pooja@example.com',
        identityVerification: {
          docType: 'AADHAAR',
          maskedId: 'XXXX-XXXX-9012',
          verifiedVia: 'AADHAAR_OFFLINE_QR',
          fullNameOnDoc: 'Pooja Sharma',
          nameMatchScore: 95,
          dobMatched: true,
          verifiedAt: new Date()
        },
        kycStatus: 'VERIFIED'
      });

      expect(user.validateSync()).toBeUndefined();
      expect(user.identityVerification.maskedId).toBe('XXXX-XXXX-9012');
      expect(user.identityVerification.verifiedVia).toBe('AADHAAR_OFFLINE_QR');
      expect(user.kycStatus).toBe('VERIFIED');
    });

    it('should record live selfie and liveness challenge confirmation', () => {
      const user = new User({
        firstName: 'Karan',
        email: 'karan@example.com',
        selfieVerification: {
          isVerified: true,
          selfieUrl: 'vault://selfie-karan.jpg',
          livenessScore: 98,
          livenessChallengePassed: true,
          verifiedAt: new Date()
        }
      });

      expect(user.validateSync()).toBeUndefined();
      expect(user.selfieVerification.isVerified).toBe(true);
      expect(user.selfieVerification.livenessScore).toBe(98);
    });

    it('should record verified emergency contact with relationship', () => {
      const user = new User({
        firstName: 'Simran',
        email: 'simran@example.com',
        profile: {
          emergencyContact: {
            name: 'Sunita Mehra',
            relation: 'Parent',
            phone: '9876543211',
            isVerified: true,
            verifiedAt: new Date()
          }
        }
      });

      expect(user.validateSync()).toBeUndefined();
      expect(user.profile.emergencyContact.name).toBe('Sunita Mehra');
      expect(user.profile.emergencyContact.relation).toBe('Parent');
      expect(user.profile.emergencyContact.isVerified).toBe(true);
    });

    it('should record student and working professional credentials', () => {
      const student = new User({
        firstName: 'Amit',
        email: 'amit@example.com',
        studentOrWorkVerification: {
          category: 'STUDENT',
          organizationName: 'Delhi University',
          designationOrCourse: 'B.Sc Computer Science',
          status: 'VERIFIED'
        }
      });
      expect(student.validateSync()).toBeUndefined();
      expect(student.studentOrWorkVerification.category).toBe('STUDENT');

      const professional = new User({
        firstName: 'Neha',
        email: 'neha@example.com',
        studentOrWorkVerification: {
          category: 'WORKING_PROFESSIONAL',
          organizationName: 'Google India',
          workEmail: 'neha@google.com',
          isWorkEmailVerified: true,
          status: 'VERIFIED'
        }
      });
      expect(professional.validateSync()).toBeUndefined();
      expect(professional.studentOrWorkVerification.category).toBe('WORKING_PROFESSIONAL');
      expect(professional.studentOrWorkVerification.isWorkEmailVerified).toBe(true);
    });
  });

});

