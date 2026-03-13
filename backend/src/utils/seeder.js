import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import connectDB from '../config/db.js';

dotenv.config();
connectDB();

const seedData = async () => {
  try {
    await Property.deleteMany();
    
    const admin = await User.findOne({ role: 'ADMIN' });

    await Property.create([
      {
        title: "Elite Boys Hostel",
        description: "Premium stay for students",
        category: "HOSTEL",
        owner: admin._id,
        basePrice: 8000,
        location: {
          address: "123 Tech Park",
          city: "Bangalore",
          state: "KA",
          coordinates: [77.5946, 12.9716]
        },
        amenities: ["WiFi", "Gym", "Laundry"]
      }
    ]);

    console.log('✅ Data Seeded Successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') seedData();