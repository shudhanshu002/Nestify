import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

describe('Auth System Integration', () => {
    // Setup: Clear database before tests
    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    let token = '';

    it('should register a new user successfully', async () => {
        const res = await request(app).post('/api/v1/auth/register').send({
            firstName: 'Test',
            lastName: 'Architect',
            email: 'tester@example.com',
            password: 'password123',
            role: 'TENANT',
        });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    });

    it('should login the registered user', async () => {
        const res = await request(app).post('/api/v1/auth/login').send({
            email: 'tester@example.com',
            password: 'password123',
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should deny access to private profile without token', async () => {
        const res = await request(app).get('/api/v1/users/profile');
        expect(res.statusCode).toBe(401);
    });

    it('should allow access to private profile with valid token', async () => {
        const res = await request(app).get('/api/v1/users/profile').set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe('tester@example.com');
    });
});
