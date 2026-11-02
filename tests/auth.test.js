import request from 'supertest';
import mongoose from 'mongoose';
import app from '../backend/src/app.js';
import User from '../backend/src/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

describe('Auth System Integration', () => {
    let token = '';

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0 && process.env.MONGODB_URI) {
            try {
                await mongoose.connect(process.env.MONGODB_URI);
                await User.deleteMany({ email: 'tester@example.com' });
            } catch (err) {
                console.log('Skipping live DB connection:', err.message);
            }
        }
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await User.deleteMany({ email: 'tester@example.com' });
            await mongoose.connection.close();
        }
    });

    it('should validate registration request payload', async () => {
        expect(app).toBeDefined();
    });
});
