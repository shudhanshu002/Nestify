import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['PHONE_VERIFICATION', 'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_OTP'], 
    required: true 
  },
  otp: { 
    type: String, 
    required: true 
  },
  target: { 
    type: String, 
    required: true // Store the email or phone number here
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 // Automatically delete after 10 minutes (600 seconds)
  }
});

const Verification = mongoose.model('Verification', verificationSchema);
export default Verification;