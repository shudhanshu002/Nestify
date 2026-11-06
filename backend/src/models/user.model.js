import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  relation: { type: String, default: '', trim: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date }
}, { _id: false });

const identityVerificationSchema = new mongoose.Schema({
  docType: { 
    type: String, 
    enum: ['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'], 
    default: 'AADHAAR' 
  },
  maskedId: { type: String, default: '' },
  verifiedVia: { 
    type: String, 
    enum: ['AADHAAR_OFFLINE_QR', 'GOV_ID_CONSENT', 'DOCUMENT_UPLOAD', 'MANUAL_AUDIT'], 
    default: 'DOCUMENT_UPLOAD' 
  },
  fullNameOnDoc: { type: String, default: '' },
  nameMatchScore: { type: Number, default: 0 },
  dobOnDoc: { type: String, default: '' },
  dobMatched: { type: Boolean, default: false },
  verifiedAt: { type: Date }
}, { _id: false });

const selfieVerificationSchema = new mongoose.Schema({
  isVerified: { type: Boolean, default: false },
  selfieUrl: { type: String, default: '' },
  livenessScore: { type: Number, default: 0 },
  livenessChallengePassed: { type: Boolean, default: false },
  verifiedAt: { type: Date }
}, { _id: false });

const studentOrWorkSchema = new mongoose.Schema({
  category: { 
    type: String, 
    enum: ['NONE', 'STUDENT', 'WORKING_PROFESSIONAL'], 
    default: 'NONE' 
  },
  organizationName: { type: String, default: '', trim: true },
  designationOrCourse: { type: String, default: '', trim: true },
  workEmail: { type: String, default: '', trim: true, lowercase: true },
  isWorkEmailVerified: { type: Boolean, default: false },
  idCardUrl: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'], 
    default: 'NOT_SUBMITTED' 
  },
  verifiedAt: { type: Date }
}, { _id: false });

const profileSchema = new mongoose.Schema({
  avatar: { type: String, default: '' },
  bio: { type: String, maxLength: 500 },
  lifestylePreferences: [String],
  emergencyContact: {
    type: emergencyContactSchema,
    default: () => ({ name: '', phone: '', relation: '', isVerified: false })
  }
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

const ownerDetailsSchema = new mongoose.Schema({
  entityType: { 
    type: String, 
    enum: ['INDIVIDUAL', 'REGISTERED_BUSINESS', 'AUTHORIZED_MANAGER'], 
    default: 'INDIVIDUAL' 
  },
  businessName: { type: String, default: '' },
  panNumber: { type: String, default: '', trim: true },
  gstin: { type: String, default: '', trim: true },
  bankDetails: {
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' }
  },
  operatingCity: { type: String, default: '' },
  legalAgreementAccepted: { type: Boolean, default: false },
  agreementAcceptedAt: { type: Date },
  ownershipDeclaration: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, sparse: true },
    role: { type: String, enum: ['TENANT', 'OWNER', 'ADMIN'], default: 'TENANT' },
    phone: { type: String, sparse: true, index: true },
    dateOfBirth: { type: Date },
    avatar: { type: String, default: '' },
    googleId: { type: String, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    phoneVerifiedAt: { type: Date },
    
    // Core Identity & KYC Fields
    kycStatus: { 
      type: String, 
      enum: ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'], 
      default: 'NOT_SUBMITTED' 
    },
    identityVerification: { 
      type: identityVerificationSchema, 
      default: () => ({}) 
    },
    kycDocuments: [{
        docType: { type: String, enum: ['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'] },
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    kycRejectionReason: { type: String, default: '' },

    // Selfie & Liveness Verification
    selfieVerification: { 
      type: selfieVerificationSchema, 
      default: () => ({ isVerified: false, livenessScore: 0, livenessChallengePassed: false }) 
    },

    // Student / Employment Verification (Optional)
    studentOrWorkVerification: { 
      type: studentOrWorkSchema, 
      default: () => ({ category: 'NONE', status: 'NOT_SUBMITTED' }) 
    },

    profile: {
      type: profileSchema,
      default: () => ({})
    },

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

    // Owner Business & Legal Onboarding
    ownerDetails: { 
      type: ownerDetailsSchema, 
      default: () => ({}) 
    },
    isOwnerOnboarded: { type: Boolean, default: false },

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
