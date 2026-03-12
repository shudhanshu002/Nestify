import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true,
    index: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: true, 
    trim: true 
  },
  
  // Privacy & Safety Engine from ER
  isFlagged: { type: Boolean, default: false }, // AbuseControl
  flagReason: { type: String },
  containsContactInfo: { type: Boolean, default: false }, // PrivacyEngine detection

  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;