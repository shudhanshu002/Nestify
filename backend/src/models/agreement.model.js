import mongoose from 'mongoose';

const agreementSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  documentUrl: String, // PDF of the signed agreement
  signedAt: Date,
  status: { type: String, enum: ['PENDING', 'SIGNED', 'EXPIRED'], default: 'PENDING' },
  clauses: [String] // House rules accepted
}, { timestamps: true });

export default mongoose.model('Agreement', agreementSchema);