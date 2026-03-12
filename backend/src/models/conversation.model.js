import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }],
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  lastMessage: { 
    type: String, 
    default: "" 
  },
  lastMessageAt: { 
    type: Date, 
    default: Date.now 
  },
  unreadCount: { 
    type: Map, 
    of: Number, 
    default: {} 
  }
}, { timestamps: true });

// Ensure unique conversation per Property + Participants pair
conversationSchema.index({ property: 1, participants: 1 }, { unique: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;