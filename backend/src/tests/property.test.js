import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Property from '../models/property.model.js';
import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';

describe('Property & Search API', () => {
  let ownerToken;
  let ownerId;

  beforeAll(async () => {
    await Property.deleteMany({});
    const owner = await User.create({
      firstName: 'Owner', lastName: 'Test',
      email: 'owner@test.com', password: 'password123', role: 'OWNER'
    });
    ownerId = owner._id;
    ownerToken = generateToken(ownerId);
  });

  it('should create a new property listing (Protected)', async () => {
    const res = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: "Sunset PG",
        description: "Best PG in the city",
        category: "PG",
        basePrice: 5000,
        location: {
          address: "Sector 5", city: "Delhi", state: "DL",
          coordinates: [77.1025, 28.7041]
        }
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Sunset PG");
  });

  it('should search properties by category', async () => {
    const res = await request(app).get('/api/v1/properties/search?category=PG');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});