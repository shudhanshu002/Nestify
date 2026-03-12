import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Owner or Tenant
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  
  reason: { 
    type: String, 
    enum: ['SECURITY_DEPOSIT', 'MAINTENANCE_ISSUE', 'MISLEADING_LISTING', 'PAYMENT_FAILURE'], 
    required: true 
  },
  description: { type: String, required: true },
  evidence: [String], // URLs to photos/videos
  
  status: { 
    type: String, 
    enum: ['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED'], 
    default: 'OPEN' 
  },
  resolution: { type: String }, // Admin's final decision
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin ID
  
  // SLA tracking from ER
  slaDeadline: { type: Date, default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) } // 48-hour resolution goal
}, { timestamps: true });

const Dispute = mongoose.model('Dispute', disputeSchema);
export default Dispute;