import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  brandLogo: { type: String },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Commission Policy from ER
  commissionPolicy: {
    type: { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
    value: { type: Number, default: 10 } // e.g., 10% platform fee
  },
  
  isVerified: { type: Boolean, default: false },
  slaTerms: { type: String }, // Service Level Agreement
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String
  }
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
export default Company;