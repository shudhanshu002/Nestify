import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import generateToken from '../utils/generateToken.js';
import dotenv from 'dotenv';

dotenv.config();

describe('Chat & Privacy Engine', () => {
  let token;
  let receiverId;
  let propId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    // Clean up
    await User.deleteMany({ email: { $in: ['chat-sender@test.com', 'chat-receiver@test.com'] } });
    await Property.deleteMany({ title: 'Chat Test Property' });

    // 1. Create Sender
    const sender = await User.create({
      firstName: 'Sender', lastName: 'User',
      email: 'chat-sender@test.com', password: 'password123'
    });
    token = generateToken(sender._id);

    // 2. Create Receiver (Must be a real user in DB)
    const receiver = await User.create({
      firstName: 'Receiver', lastName: 'Owner',
      email: 'chat-receiver@test.com', password: 'password123'
    });
    receiverId = receiver._id;

    // 3. Create Property (Must be a real property in DB)
    const property = await Property.create({
      title: 'Chat Test Property',
      description: 'Testing chat privacy',
      category: 'PG',
      owner: receiverId,
      basePrice: 5000,
      location: {
        address: 'Test Street',
        city: 'Test City',
        state: 'TS',
        coordinates: { type: 'Point', coordinates: [77.123, 28.123] }
      }
    });
    propId = property._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should flag a message containing a phone number', async () => {
    const res = await request(app)
      .post('/api/v1/chat/send')
      .set('Authorization', `Bearer ${token}`)
      .send({
        receiverId: receiverId.toString(),
        propertyId: propId.toString(),
        text: "Call me at 9876543210 to book directly"
      });

    expect(res.statusCode).toBe(201);
    
    // Check if the privacy engine flagged the contact info
    // Accessing through res.body.data because of our Controller structure
    expect(res.body.data.containsContactInfo).toBe(true);
  });
});