import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  roomType: { 
    type: String, 
    enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'STUDIO'], 
    required: true 
  },
  basePrice: { type: Number, required: true },
  capacity: { type: Number, required: true }, // Total beds/spaces
  availableInventory: { type: Number, required: true }, // Current available spaces
  amenities: [String],
  images: [String],
  
  // High-Grade Features from ER
  isLocked: { type: Boolean, default: false }, // For race condition prevention
  lockTimeout: { type: Date, default: null },
  dynamicPrice: { type: Number } // Engine-calculated price
}, { 
  timestamps: true 
});

const Room = mongoose.model('Room', roomSchema);
export default Room;