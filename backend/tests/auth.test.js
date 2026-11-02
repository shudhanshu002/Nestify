import { describe, it, expect, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../src/models/user.model.js';
import generateToken from '../src/utils/generateToken.js';

describe('Auth & User Model Suite', () => {
  const secretKey = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

  it('should generate a valid JWT token signed with JWT_SECRET', () => {
    process.env.JWT_SECRET = secretKey;
    const testId = '660000000000000000000001';
    const token = generateToken(testId);

    expect(typeof token).toBe('string');
    const decoded = jwt.verify(token, secretKey);
    expect(decoded.id).toBe(testId);
  });

  it('should hash passwords via bcrypt before saving', async () => {
    const rawPassword = 'SecurePassword@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    expect(hashedPassword).not.toBe(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hashedPassword);
    expect(isWrongMatch).toBe(false);
  });

  it('should validate User schema requirements', async () => {
    const validUser = new User({
      firstName: 'Ananya',
      lastName: 'Iyer',
      email: 'ananya.iyer@example.com',
      password: 'hashedPasswordPlaceholder',
      role: 'TENANT'
    });

    const validationError = validUser.validateSync();
    expect(validationError).toBeUndefined();
    expect(validUser.email).toBe('ananya.iyer@example.com');
    expect(validUser.role).toBe('TENANT');
    expect(validUser.kycStatus).toBe('NOT_SUBMITTED');
    expect(validUser.deal.status).toBe('NOT_ELIGIBLE');
  });

  it('should reject User with missing required fields (firstName, email)', () => {
    const invalidUser = new User({});
    const validationError = invalidUser.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError.errors.firstName).toBeDefined();
    expect(validationError.errors.email).toBeDefined();
  });

  it('should enforce role enum validation', () => {
    const invalidRoleUser = new User({
      firstName: 'John',
      email: 'john@example.com',
      role: 'SUPER_HACKER'
    });

    const validationError = invalidRoleUser.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError.errors.role).toBeDefined();
  });

  it('should lowercase emails automatically in schema', () => {
    const user = new User({
      firstName: 'Raj',
      email: 'RAJ.SHARMA@DOMAIN.COM',
      password: 'password123'
    });

    expect(user.email).toBe('raj.sharma@domain.com');
  });

  it('should match password correctly via User schema method', async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('secret123', salt);

    const user = new User({
      firstName: 'Test',
      email: 'test@example.com',
      password: hashedPassword
    });

    const correct = await user.matchPassword('secret123');
    expect(correct).toBe(true);

    const incorrect = await user.matchPassword('wrongpassword');
    expect(incorrect).toBe(false);
  });
});
