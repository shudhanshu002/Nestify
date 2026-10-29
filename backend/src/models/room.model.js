import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  roomType: { type: String, enum: ['CLASSIC', 'DELUXE', 'PREMIUM', 'SUITE'], default: 'CLASSIC' },
  basePrice: { type: Number, required: true },
  
  // 󾠮 THE INVENTORY MATRIX
  totalInventory: { type: Number, required: true, default: 1 },
  availableInventory: { type: Number, required: true }, 

  capacity: { type: Number, default: 1 },
  roomSize: { type: String, default: '9 sqm approx' },
  amenities: [String],
  images: [{ url: String, public_id: String }]
}, { timestamps: true });

// Sync available inventory on first creation
roomSchema.pre('save', function(next) {
  if (this.isNew && !this.availableInventory) {
    this.availableInventory = this.totalInventory;
  }
  next();
});

export default mongoose.model('Room', roomSchema);