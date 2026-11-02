import request from 'supertest';
import mongoose from 'mongoose';
import app from '../backend/src/app.js';
import Property from '../backend/src/models/property.model.js';
import User from '../backend/src/models/user.model.js';
import generateToken from '../backend/src/utils/generateToken.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

describe('Property & Search API Integration', () => {
    it('should have app and Property model defined', () => {
        expect(app).toBeDefined();
        expect(Property).toBeDefined();
        expect(User).toBeDefined();
    });
});
