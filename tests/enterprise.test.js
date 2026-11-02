import request from 'supertest';
import mongoose from 'mongoose';
import app from '../backend/src/app.js';
import Property from '../backend/src/models/property.model.js';
import User from '../backend/src/models/user.model.js';
import generateToken from '../backend/src/utils/generateToken.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

describe('Enterprise Property Integration', () => {
    it('should have app and models defined', () => {
        expect(app).toBeDefined();
        expect(Property).toBeDefined();
        expect(User).toBeDefined();
    });
});
