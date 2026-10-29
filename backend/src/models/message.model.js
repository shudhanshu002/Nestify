import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  isFlagged: { type: Boolean, default: false },
  containsContactInfo: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  status: { type: String, enum: ['SENT', 'DELIVERED', 'READ'], default: 'SENT' },
  deliveredAt: { type: Date },
  readAt: { type: Date }
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);