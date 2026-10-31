import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['KYC_UPDATE', 'PROPERTY_VERIFICATION', 'BOOKING', 'MAINTENANCE'], 
    default: 'MAINTENANCE' 
  },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, 
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
