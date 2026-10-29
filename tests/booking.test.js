import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';
import dotenv from 'dotenv';

dotenv.config();

describe('Booking Logic & Race Conditions', () => {
    let tenantToken;
    let roomId;

    beforeAll(async () => {
        // 1. Ensure DB Connection
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // 2. Clean Database to prevent 'already locked' errors
        await User.deleteMany({ email: 'tenant-test@example.com' });
        await Room.deleteMany({ roomNumber: 'TEST-ROOM-101' }); 

        // 3. Setup Tenant
        const tenant = await User.create({
            firstName: 'Tenant',
            lastName: 'User',
            email: 'tenant-test@example.com',
            password: 'password123',
            role: 'TENANT'
        });
        tenantToken = generateToken(tenant._id);

        // 4. Setup Room (Force starts as unlocked)
        const room = await Room.create({
            property: new mongoose.Types.ObjectId(),
            roomType: 'SINGLE',
            basePrice: 2000,
            capacity: 1,
            availableInventory: 1,
            isLocked: false,
            roomNumber: 'TEST-ROOM-101'
        });
        roomId = room._id;
    });

    afterAll(async () => {
        // Cleanup
        await User.deleteMany({ email: 'tenant-test@example.com' });
        await Room.deleteMany({ roomNumber: 'TEST-ROOM-101' });
        await mongoose.connection.close();
    });

    it('should lock a room for booking', async () => {
        const res = await request(app)
            .post('/api/v1/bookings/initiate')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ roomId });

        // Verify status
        expect(res.statusCode).toBe(200);
        
        // Verify that the room is actually locked in the database
        const updatedRoom = await Room.findById(roomId);
        expect(updatedRoom.isLocked).toBe(true);
    });

    it('should fail if another user tries to lock the same room immediately', async () => {
        // Attempt to lock the same room again
        const res = await request(app)
            .post('/api/v1/bookings/initiate')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ roomId });

        // Should return 400 because the previous test already locked it
        expect(res.statusCode).toBe(400);
        
        // Match the message from your controller's error log
        expect(res.body.message).toMatch(/unavailable|booked|locked/i);
    });
});