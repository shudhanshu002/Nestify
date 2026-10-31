import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  issueType: { type: String, enum: ['PLUMBING', 'WIFI', 'CLEANING', 'ELECTRIC', 'OTHER'], required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  resolutionNote: { type: String }, // Manager's reply
  userRating: { type: Number, min: 1, max: 5 }, // 1-5 Stars
  userFeedback: { type: String }, // User's comment on the fix
  resolvedAt: { type: Date },
  adminNotes: { type: String }, // For the Admin to give instr
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' }
}, { timestamps: true });

export default mongoose.model('Maintenance', maintenanceSchema);
