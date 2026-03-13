import request from 'supertest';
import app from '../app.js';
import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';
import mongoose from 'mongoose';

describe('Chat & Privacy Engine', () => {
  let token;
  let receiverId = new mongoose.Types.ObjectId();
  let propId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    const user = await User.create({
      firstName: 'Chatter', lastName: 'A',
      email: 'chat@test.com', password: 'password123'
    });
    token = generateToken(user._id);
  });

  it('should flag a message containing a phone number', async () => {
    const res = await request(app)
      .post('/api/v1/chat/send')
      .set('Authorization', `Bearer ${token}`)
      .send({
        receiverId,
        propertyId: propId,
        text: "Call me at 9876543210 to book directly"
      });

    expect(res.body.containsContactInfo).toBe(true);
  });
});