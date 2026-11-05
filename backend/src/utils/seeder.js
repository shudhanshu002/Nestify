import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Models
import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import Room from '../models/room.model.js';
import Company from '../models/company.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const seedData = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ ERROR: MONGODB_URI is undefined.");
    process.exit(1);
  }

  try {
    console.log("🛠️  Connecting to Database...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log("🗑️  Wiping existing data...");
    await User.deleteMany();
    await Property.deleteMany();
    await Room.deleteMany();
    await Company.deleteMany();
    
    console.log("🏗️  Building Industry-Scale Ecosystem...");

    // 1. CREATE USERS
    const platformAdmin = await User.create({
      firstName: "Shudhanshu", lastName: "Singh",
      email: "admin@pgfinder.com", password: "password123",
      role: "ADMIN", isSuperAdmin: true, isEmailVerified: true
    });

    const individualOwner = await User.create({
      firstName: "Ananya", lastName: "Iyer",
      email: "ananya@pgowner.com", password: "password123",
      role: "OWNER", kycStatus: "VERIFIED", isEmailVerified: true
    });

    const companyAdmin = await User.create({
      firstName: "Vikram", lastName: "Aditya",
      email: "owner@royalhotels.com", password: "password123",
      role: "COMPANY_ADMIN", isEmailVerified: true
    });

    const rajeshManager = await User.create({
      firstName: "Rajesh", lastName: "Reddy",
      email: "motel_owner@test.com", password: "password123",
      role: "COMPANY_MANAGER", isEmailVerified: true
    });

    const sudhaTenant = await User.create({
      firstName: "Sudha", lastName: "Singh",
      email: "sudha@test.com", password: "password123",
      role: "TENANT", isEmailVerified: true
    });

    console.log("👥 Users Created: Admin, Individual Owner, Company Admin, Manager, Tenant.");

    // 2. CREATE THE COMPANY
    const royalCompany = await Company.create({
      name: "Royal Hotel Series",
      admin: companyAdmin._id,
      managers: [rajeshManager._id],
      isVerified: true,
      commissionPolicy: { type: 'PERCENTAGE', value: 10 }
    });

    // 3. CREATE PROPERTIES (Fixed with basePrice)
    const properties = await Property.create([
      {
        title: "Royal Residency Phagwara",
        description: "Premium corporate living for LPU students managed by Royal Series.",
        category: "PG",
        basePrice: 9000, // 󾠮 ADDED THIS
        owner: companyAdmin._id,
        company: royalCompany._id,
        manager: rajeshManager._id, 
        isVerified: true,
        location: {
          address: "LPU Gate 1", city: "Phagwara", state: "Punjab",
          coordinates: { type: "Point", coordinates: [75.7033, 31.2555] }
        },
        images: [{ url: "https://images.unsplash.com/photo-1555854817-5b2247a8175f", public_id: "corp_pg" }]
      },
      {
        title: "Ananya's Luxury PG",
        description: "Home-style PG with personal care, healthy meals, and high security.",
        category: "PG",
        basePrice: 12000, // 󾠯 ADDED THIS
        owner: individualOwner._id,
        company: null, 
        manager: null, 
        isVerified: true,
        location: {
          address: "Law Gate Road", city: "Phagwara", state: "Punjab",
          coordinates: { type: "Point", coordinates: [75.7050, 31.2520] }
        },
        images: [{ url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf", public_id: "indie_pg" }]
      }
    ]);

    // 4. CREATE ROOMS
    await Room.create([
      { 
        property: properties[0]._id, roomType: "CLASSIC", 
        roomNumber: "R-101", capacity: 2, basePrice: 9000,
        amenities: ["WiFi", "AC"], isAvailable: true 
      },
      { 
        property: properties[1]._id, roomType: "DELUXE", 
        roomNumber: "A-01", capacity: 1, basePrice: 12000,
        amenities: ["TV", "Home Food"], isAvailable: true 
      }
    ]);

    console.log("🏢 Database Seeded: Corporate & Individual Models Live.");
    console.log("✅ SUCCESS: Ready for testing.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    process.exit(1);
  }
};

seedData();