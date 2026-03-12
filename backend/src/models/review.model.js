import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    property: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Property', 
        required: true 
    },
    booking: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking', 
        required: true 
    },

    // ratings
    ratings: {
        cleanliness: { type: Number, min: 1, max: 5, required: true },
        maintenance: { type: Number, min: 1, max: 5, required: true },
        safety: { type: Number, min: 1, max: 5, required: true },
        services: { type: Number, min: 1, max: 5, required: true }
    },

    comment: {
        type: String,
        required: true,
        maxLength: 1000
    },
    images: [String],

    // saftuy part
    safetySignals: {
        noiseLevel: { type: String, enum: ['Low', 'Moderate', 'High'] },
        internetSpeed: { type: String, enum: ['Slow', 'Good', 'Excellent'] },
        powerBackupReliability: { type: Boolean }
    },

    isVerifiedStay: { type: Boolean, default: true },
    isModerated: { type: Boolean, default: false },
    authenticityScore: { type: Number, default: 100 }
}, {timestamps: true});

// Prevent multiple reviews for the same booking
reviewSchema.index({user: 1, booking: 1}, {unique: true});

const Review = mongoose.model('Review', reviewSchema);
export default Review;