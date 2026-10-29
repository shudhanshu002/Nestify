import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const propertySchema = new mongoose.Schema({
  title: String, owner: mongoose.Schema.Types.ObjectId,
  location: Object
}, { strict: false });

const Property = mongoose.model('Property', propertySchema);

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");
        const properties = await Property.find().sort({createdAt: -1}).limit(5);
        console.log(`Found ${properties.length} recent properties.`);
        properties.forEach(p => console.log(p.title, p._id, p.createdAt));
        process.exit(0);
    } catch(err) {
        console.error("DB Error:", err.message);
        process.exit(1);
    }
}
run();
