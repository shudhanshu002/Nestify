import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  // We keep participants as an array of IDs
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null }, 
  lastMessage: { type: String, default: "" },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCount: { type: Map, of: Number, default: {} }
}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);