import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Property from '../models/property.model.js';
import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';
import dotenv from 'dotenv';

dotenv.config();

describe('Property & Search API', () => {
    let ownerToken;
    let ownerId;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // Clean database to ensure a fresh search
        await Property.deleteMany({});
        await User.deleteMany({ email: 'owner@test.com' });

        const owner = await User.create({
            firstName: 'Owner',
            lastName: 'Test',
            email: 'owner@test.com',
            password: 'password123',
            role: 'OWNER',
        });
        ownerId = owner._id;
        ownerToken = generateToken(ownerId);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should create a new property listing (Protected)', async () => {
        const res = await request(app)
            .post('/api/v1/properties')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Sunset PG',
                description: 'Best PG in the city',
                category: 'PG',
                basePrice: 5000,
                location: {
                    address: 'Sector 5',
                    city: 'Delhi',
                    state: 'DL',
                    // THE FIX: Must be valid GeoJSON object
                    coordinates: {
                        type: 'Point',
                        coordinates: [77.1025, 28.7041],
                    },
                },
            });

        expect(res.statusCode).toBe(201);
        // Accessing via res.body.data because of your controller structure
        const data = res.body.data || res.body;
        expect(data.title).toBe('Sunset PG');
    });

    it('should search properties by category', async () => {
        // Give MongoDB a moment to index the property created in the previous step
        await new Promise((resolve) => setTimeout(resolve, 500));

        const res = await request(app).get('/api/v1/properties/search?category=PG');

        expect(res.statusCode).toBe(200);

        // Now res.body.data will exist because of our controller fix
        const results = res.body.data;
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].category).toBe('PG');
    });
});
