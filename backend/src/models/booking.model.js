import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  tenant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  room: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room', 
    required: true 
  },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED'], 
    default: 'PENDING' 
  },
  
  paymentStatus: { 
    type: String, 
    enum: ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'], 
    default: 'UNPAID' 
  },

  // Trust & Intelligence Signals from ER
  moveInGuarantee: { type: Boolean, default: false },
  agreementSigned: { type: Boolean, default: false },
  fraudScore: { type: Number, default: 0 },
  actualCheckInDate: { type: Date },
  actualCheckOutDate: { type: Date },

  // Extension History
  extensions: [{
    extendedAt: { type: Date, default: Date.now },
    previousCheckOutDate: { type: Date, required: true },
    newCheckOutDate: { type: Date, required: true },
    additionalDays: { type: Number, required: true },
    additionalAmount: { type: Number, required: true },
    paymentStatus: { type: String, default: 'PAID' },
    transactionId: { type: String }
  }],
}, { 
  timestamps: true 
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
