import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visitDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'], 
    default: 'PENDING' 
  },
  notes: String
}, { timestamps: true });

export default mongoose.model('PropertyVisit', visitSchema);