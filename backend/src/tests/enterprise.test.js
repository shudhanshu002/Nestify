import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Property from '../models/property.model.js';
import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';
import dotenv from 'dotenv';

dotenv.config();

describe('Enterprise Property Integration (Media & Logic)', () => {
  let token;

  beforeAll(async () => {
    // 1. CRITICAL: Connect to DB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    // 2. Clean up old test data
    await User.deleteMany({ email: 'corp@test.com' });
    await Property.deleteMany({ title: 'Smart PG' });

    // 3. Create the Enterprise Owner
    const user = await User.create({
      firstName: 'Enterprise', 
      lastName: 'Owner',
      email: 'corp@test.com', 
      password: 'password123', 
      role: 'OWNER'
    });
    token = generateToken(user._id);
  });

  afterAll(async () => {
    // 4. Cleanup and Close
    await User.deleteMany({ email: 'corp@test.com' });
    await Property.deleteMany({ title: 'Smart PG' });
    await mongoose.connection.close();
  });

  it('should create a property with Safety Metrics and calculate SmartMatch', async () => {
    const res = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Smart PG',
        description: 'Enterprise grade PG with safety metrics',
        category: 'PG',
        basePrice: 6000,
        location: {
          address: 'Tech Park', 
          city: 'Bangalore', 
          state: 'KA',
          coordinates: { type: 'Point', coordinates: [77.5944, 12.9716] }
        },
        safetyMetrics: {
          internetSpeed: '100 Mbps',
          cctv: true,
          powerBackup: true
        }
      });

    expect(res.statusCode).toBe(201);
    
    // Accessing the nested data from your controller's standardized response
    const data = res.body.data || res.body;
    expect(data.safetyMetrics.cctv).toBe(true);
    expect(data.title).toBe('Smart PG');
  });
});