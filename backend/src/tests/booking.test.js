import request from 'supertest';
import app from '../app.js';
import Room from '../models/room.model.js';
import generateToken from '../utils/generateToken.js';
import User from '../models/user.model.js';

describe('Booking Logic & Race Conditions', () => {
  let tenantToken;
  let roomId;

  beforeAll(async () => {
    const tenant = await User.create({
      firstName: 'Tenant', lastName: 'Test',
      email: 'tenant@test.com', password: 'password123'
    });
    tenantToken = generateToken(tenant._id);

    const room = await Room.create({
      property: new mongoose.Types.ObjectId(),
      roomType: 'SINGLE',
      basePrice: 2000,
      capacity: 1,
      availableInventory: 1
    });
    roomId = room._id;
  });

  it('should lock a room for booking', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/initiate')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ roomId });

    expect(res.statusCode).toBe(200);
    expect(res.body.room.isLocked).toBe(true);
  });

  it('should fail if another user tries to lock the same room immediately', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/initiate')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ roomId });

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toContain('unavailable');
  });
});