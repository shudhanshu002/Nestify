import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Student Living in North Campus"
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }, // Linked to a specific building
  location: { 
    city: String, 
    area: String 
  },
  posts: [postSchema],
  memberCount: { type: Number, default: 0 }
}, { timestamps: true });

const Community = mongoose.model('Community', communitySchema);
export default Community;