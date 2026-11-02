import mongoose from 'mongoose';

const contactRegex = /(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}|\b\d{10}\b|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { 
    type: String, 
    required: true, 
    trim: true,
    set: function(val) {
      if (val && contactRegex.test(val)) {
        this.containsContactInfo = true;
        this.isFlagged = true;
      }
      return val;
    }
  },
  isFlagged: { type: Boolean, default: false },
  containsContactInfo: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  status: { type: String, enum: ['SENT', 'DELIVERED', 'READ'], default: 'SENT' },
  deliveredAt: { type: Date },
  readAt: { type: Date }
}, { timestamps: true });

messageSchema.pre('validate', function() {
  if (this.text && contactRegex.test(this.text)) {
    this.containsContactInfo = true;
    this.isFlagged = true;
  }
});

messageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
