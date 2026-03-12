import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

// profile subSchema for cleaner user schema
const profileSchema = new mongoose.Schema({
  avatar: { type: String, default: '' },
  bio: { type: String, maxLength: 500 },
  lifestylePreferences: [String], // e.g., ['Quiet', 'Non-smoker']
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  }
}, { _id: false });

// user schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        unique: true,
        sparse: true // Allows nulls while maintaining uniqueness for others
    },
    // role part
    role: {
        type: String,
        enum: ['TENANT', 'OWNER', 'ADMIN', 'COMPANY_ADMIN', 'COMPANY_MANAGER'],
        default: 'TENANT'
    },
    // auth
    googleId: {
        type: String,
        default: null,
    },
    facebookId: {
        type: String,
        default: null,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },

    // kyc status
    kycStatus: {
        type: String,
        enum: ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'], 
        default: 'PENDING'
    },

    // metadata
    profile: profileSchema,
    lastLogin: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // Referencing other parts of ER
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
}, {
    timestamps: true
});

// Middleware: Hash password before saving
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

// Instance Method : Check password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

const User = mongoose.model('User', userSchema);
export default User;