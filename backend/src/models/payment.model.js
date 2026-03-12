import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    gateway: {
        type: String,
        enum: ['STRIPE', 'RAZORPAY', 'PAYPAL'], 
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    platformFee: {
        type: Number, 
        required: true
    },
    ownerSettlementAmount: { 
        type: Number, 
        required: true 
    },

    status: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'], 
    default: 'PENDING' 
  },
  
  settlementStatus: {
    type: String,
    enum: ['UNSETTLED', 'PROCESSING', 'SETTLED'],
    default: 'UNSETTLED'
  }
},{timestamps: true});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;