import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const profileSchema = new mongoose.Schema({
  avatar: { type: String, default: '' },
  bio: { type: String, maxLength: 500 },
  lifestylePreferences: [String],
  emergencyContact: { name: String, phone: String, relation: String }
}, { _id: false });

const ownerDealSchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['NOT_ELIGIBLE', 'PENDING_SELECTION', 'ACTIVE', 'EXPIRED'], 
    default: 'NOT_ELIGIBLE' 
  },
  dealType: { 
    type: String, 
    enum: ['ANNUAL_TOKEN', 'COMMISSION_PERCENTAGE'], 
    default: 'COMMISSION_PERCENTAGE' 
  },
  annualTokenAmount: { type: Number, default: 9999 },
  commissionRate: { type: Number, default: 6 }, // 6% per booking
  agreementReference: { type: String, default: '' },
  agreedAt: { type: Date },
  validUntil: { type: Date },
  termsAccepted: { type: Boolean, default: false },
  signatureName: { type: String, default: '' },
  paymentStatus: { 
    type: String, 
    enum: ['NOT_APPLICABLE', 'PENDING', 'PAID'], 
    default: 'NOT_APPLICABLE' 
  },
  adminNotes: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
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
    deal: { 
      type: ownerDealSchema, 
      default: () => ({ 
        status: 'NOT_ELIGIBLE', 
        dealType: 'COMMISSION_PERCENTAGE',
        annualTokenAmount: 9999,
        commissionRate: 6,
        paymentStatus: 'NOT_APPLICABLE'
      }) 
    },
    // Major Admin & Governance Fields
    isSuperAdmin: { type: Boolean, default: false },
    adminSuspended: { type: Boolean, default: false },
    managedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    isActive: { type: Boolean, default: true },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
}, { timestamps: true });

// Anti-Data-Leakage: Strip password hash automatically when serialized to JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  }
});

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
