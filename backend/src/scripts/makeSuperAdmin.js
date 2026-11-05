import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const emailArg = process.argv[2];
const passwordArg = process.argv[3];
const firstNameArg = process.argv[4] || 'Major';
const lastNameArg = process.argv[5] || 'Admin';

const usage = () => {
  console.log(`
========================================================================
🛡️  NESTIFY PLATFORM - MAJOR ADMIN (SUPERADMIN) PROVISIONING TOOL
========================================================================

Usage:
  1. Promote an existing registered user to SuperAdmin:
     npm run make-superadmin <email>
     Example: npm run make-superadmin sudha@test.com

  2. Create a brand-new SuperAdmin directly:
     npm run make-superadmin <email> <password> [firstName] [lastName]
     Example: npm run make-superadmin boss@nestify.com SecretPass123! Shudhanshu Singh
========================================================================
`);
};

const run = async () => {
  if (!emailArg || emailArg === '--help' || emailArg === '-h') {
    usage();
    process.exit(1);
  }

  const cleanEmail = emailArg.toLowerCase().trim();

  if (!process.env.MONGODB_URI) {
    console.error("❌ ERROR: MONGODB_URI is not defined in backend/.env");
    process.exit(1);
  }

  try {
    console.log("🔌 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB.");

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // User exists -> Promote to Major Admin
      user.role = 'ADMIN';
      user.isSuperAdmin = true;
      user.adminSuspended = false;
      user.isActive = true;
      user.isEmailVerified = true;
      if (passwordArg) {
        user.password = passwordArg; // pre-save hook will hash it
      }
      await user.save();

      console.log(`
🎉 SUCCESS: Existing user "${user.email}" (${user.firstName} ${user.lastName}) has been promoted to MAJOR ADMIN (SUPERADMIN)!
   - Role: ${user.role}
   - isSuperAdmin: ${user.isSuperAdmin}
   - adminSuspended: ${user.adminSuspended}
      `);
    } else {
      // User does not exist -> Create new SuperAdmin
      if (!passwordArg) {
        console.error(`❌ User "${cleanEmail}" does not exist in database.`);
        console.error(`   To create a new SuperAdmin account, provide a password:`);
        console.error(`   npm run make-superadmin ${cleanEmail} <password> [firstName] [lastName]`);
        process.exit(1);
      }

      user = await User.create({
        firstName: firstNameArg,
        lastName: lastNameArg,
        email: cleanEmail,
        password: passwordArg,
        role: 'ADMIN',
        isSuperAdmin: true,
        isEmailVerified: true,
        isActive: true,
        adminSuspended: false
      });

      console.log(`
🎉 SUCCESS: Brand new MAJOR ADMIN (SUPERADMIN) created!
   - Name: ${user.firstName} ${user.lastName}
   - Email: ${user.email}
   - Role: ${user.role}
   - isSuperAdmin: true
      `);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Provisioning failed:", err.message);
    process.exit(1);
  }
};

run();

