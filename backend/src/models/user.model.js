import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const profileSchema = new mongoose.Schema({
  avatar: { type: String, default: '' },
  bio: { type: String, maxLength: 500 },
  lifestylePreferences: [String],
  emergencyContact: { name: String, phone: String, relation: String }
}, { _id: false });

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, sparse: true },
    role: { type: String, enum: ['TENANT', 'OWNER', 'ADMIN'], default: 'TENANT' },
    phone: { type: String, sparse: true },
    avatar: { type: String, default: '' },
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    
    // KYC Fields
    kycStatus: { 
      type: String, 
      enum: ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'], 
      default: 'NOT_SUBMITTED' 
    },
    kycDocuments: [{
        docType: { type: String, enum: ['AADHAAR', 'PAN', 'PASSPORT'] },
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    kycRejectionReason: { type: String, default: '' },

    profile: profileSchema,
    isActive: { type: Boolean, default: true },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();
    if(!this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    if(!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
