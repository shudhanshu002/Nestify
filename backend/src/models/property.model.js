import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['PG', 'Hotel', 'Motel', 'Hostel', 'Guest House'], 
    required: true 
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
  },

  amenities: [String],
  genderPreference: { type: String, enum: ['MALE', 'FEMALE', 'UNISEX'], default: 'UNISEX' },
  isVerified: { type: Boolean, default: false },
  
  safetyMetrics: {
    noiseLevel: { type: String, default: 'Low' },
    internetSpeed: { type: String, default: 'High' },
    powerBackup: { type: Boolean, default: true },
    cctv: { type: Boolean, default: false }
  },

  // Explicit Property Tier: Assigned by Owner or Admin
  tier: { 
    type: String, 
    enum: ['FLAGSHIP', 'LUXURY', 'BUDGET', 'STANDARD'], 
    default: 'FLAGSHIP' 
  },

  verificationStatus: { 
    type: String, 
    enum: ['PENDING', 'VERIFIED', 'REJECTED'], 
    default: 'PENDING' 
  },
  legalDocuments: [{
    docType: { type: String, default: 'OWNERSHIP_DEED' },
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  rejectionReason: { type: String, default: '' },

  images: [{ url: String, public_id: String }],
  basePrice: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
}, { timestamps: true });

propertySchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.model('Property', propertySchema);
