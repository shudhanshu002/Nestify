import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true, default: () => `DS-${Math.floor(100000 + Math.random() * 900000)}` },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Tenant
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // If it's a chain
  
  issueType: { 
    type: String, 
    enum: ['REFUND', 'MAINTENANCE', 'SECURITY', 'MISCONDUCT', 'OTHER'], 
    required: true 
  },
  description: { type: String, required: true },
  evidenceImages: [String],

  // 󾠮 ESCALATION LOGIC
  status: { 
    type: String, 
    enum: ['OPEN', 'RESOLVED', 'ESCALATED_TO_COMPANY', 'ESCALATED_TO_PLATFORM'], 
    default: 'OPEN' 
  },
  
  resolutionLevel: { 
    type: String, 
    enum: ['MANAGER', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'], 
    default: 'MANAGER' 
  },

  finalVerdict: { type: String }, // Written by the Admin who closes it
}, { timestamps: true });

export default mongoose.model('Dispute', disputeSchema);