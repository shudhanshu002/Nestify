import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['PG', 'HOSTEL', 'MOTEL', 'HOTEL'], 
    required: true 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  company: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    default: null 
  },
  
  // Location with GeoJSON for "Near Me" searches
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    }
  },

  amenities: [String],
  genderPreference: { 
    type: String, 
    enum: ['MALE', 'FEMALE', 'UNISEX'], 
    default: 'UNISEX' 
  },
  
  // High-Grade Features from ER
  isVerified: { type: Boolean, default: false },
  verificationBadge: { type: String, enum: ['NONE', 'BRONZE', 'SILVER', 'GOLD'], default: 'NONE' },
  safetyMetrics: {
    noiseLevel: { type: String, default: 'Low' },
    internetSpeed: { type: String, default: 'High' },
    powerBackup: { type: Boolean, default: true },
    cctv: { type: Boolean, default: false }
  },
  basePrice: { type: Number, required: true },
  images: [{
    url: String,
    public_id: String // For deleting from Cloudinary
  }],
  
  // AI & Ranking
  smartMatchScore: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

// Index for proximity searches
propertySchema.index({ "location.coordinates": "2dsphere" });

const Property = mongoose.model('Property', propertySchema);
export default Property;