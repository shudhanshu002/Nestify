import mongoose from 'mongoose';
import Property from '../models/property.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 🔥 Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 🔥 Replace with real user ID
const OWNER_ID = "69c00935d693bb55c245edfa";

const dummyProperties = [
  {
    title: "The Matrix Executive PG",
    description: "Premium living for tech professionals near Sector 62. High-speed fiber included.",
    category: "PG",
    owner: OWNER_ID,
    location: {
      address: "B-24, Sector 62",
      city: "Noida",
      state: "Uttar Pradesh",
      coordinates: { type: "Point", coordinates: [77.3673, 28.6297] }
    },
    basePrice: 12000,
    genderPreference: "UNISEX",
    verificationStatus: "VERIFIED",
    amenities: ["WiFi", "CCTV", "Power Backup", "Gym"],
    images: [
      { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267", public_id: "test_1" }
    ]
  },
  {
    title: "Cyber City Hostel",
    description: "Budget friendly stay for students near the metro station.",
    category: "Hostel",
    owner: OWNER_ID,
    location: {
      address: "Sector 15 Metro Station",
      city: "Noida",
      state: "Uttar Pradesh",
      coordinates: { type: "Point", coordinates: [77.3113, 28.5847] }
    },
    basePrice: 8500,
    genderPreference: "MALE",
    verificationStatus: "VERIFIED",
    amenities: ["WiFi", "Laundry"],
    images: [
      { url: "https://images.unsplash.com/photo-1555854817-5b2247a8175f", public_id: "test_2" }
    ]
  },
  {
    title: "Skyline Guest House",
    description: "Luxury suites with panoramic views of the city skyline.",
    category: "Guest House",
    owner: OWNER_ID,
    location: {
      address: "Sector 18 Market",
      city: "Noida",
      state: "Uttar Pradesh",
      coordinates: { type: "Point", coordinates: [77.3260, 28.5708] }
    },
    basePrice: 25000,
    genderPreference: "UNISEX",
    verificationStatus: "VERIFIED",
    amenities: ["WiFi", "CCTV", "Parking", "AC"],
    images: [
      { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945", public_id: "test_3" }
    ]
  },
  {
    title: "Indirapuram Studio Stays",
    description: "Fully furnished studios for digital nomads.",
    category: "PG",
    owner: OWNER_ID,
    location: {
      address: "Vaibhav Khand",
      city: "Ghaziabad",
      state: "Uttar Pradesh",
      coordinates: { type: "Point", coordinates: [77.3730, 28.6377] }
    },
    basePrice: 15000,
    genderPreference: "FEMALE",
    verificationStatus: "VERIFIED",
    amenities: ["WiFi", "Kitchen", "Security"],
    images: [
      { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", public_id: "test_4" }
    ]
  }
];

const seedDB = async () => {
  try {
    // 🔍 Debug check
    console.log("MONGO_URI:", process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGO_URI not found in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Database Connected");

    // Optional: clear old data
    // await Property.deleteMany({ verificationStatus: 'VERIFIED' });

    await Property.insertMany(dummyProperties);
    console.log("✅ Properties Seeded");

    // Ensure geospatial index
    await Property.collection.createIndex({ "location.coordinates": "2dsphere" });
    console.log("✅ Geo Index Created");

    await mongoose.connection.close();
    console.log("✅ Connection Closed");
  } catch (err) {
    console.error("❌ Seeding Failed:", err.message);
    process.exit(1);
  }
};

seedDB();
