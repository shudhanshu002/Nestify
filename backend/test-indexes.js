import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const indexes = await db.collection('properties').indexes();
        console.log("Indexes on properties:");
        console.log(JSON.stringify(indexes, null, 2));
        process.exit(0);
    } catch(err) {
        console.error("DB Error:", err.message);
        process.exit(1);
    }
}
run();
