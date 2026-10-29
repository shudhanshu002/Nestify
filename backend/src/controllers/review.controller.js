import Review from '../models/review.model.js';
import Booking from '../models/booking.model.js';
import Property from '../models/property.model.js';

// @desc    Add a multi-point verified review
// @route   POST /api/v1/reviews/:propertyId
export const addReview = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { ratings, comment, safetySignals, bookingId } = req.body;

    // 1. 󾠮 SECURITY: Verify the stay is COMPLETED
    // Reviews are only allowed after checkout to ensure authenticity
    const validBooking = await Booking.findOne({
      _id: bookingId,
      property: propertyId,
      tenant: req.user._id,
      status: 'COMPLETED' 
    });

    if (!validBooking) {
      return res.status(403).json({
        success: false,
        message: "You can only review a property after your stay is completed."
      });
    }

    // 2. 󾠯 HANDLE MULTI-PART DATA (Multer Images + JSON strings)
    const reviewImages = req.files?.map(file => file.path) || [];
    const parsedRatings = typeof ratings === 'string' ? JSON.parse(ratings) : ratings;
    const parsedSignals = typeof safetySignals === 'string' ? JSON.parse(safetySignals) : safetySignals;

    // 3. 󾠰 CREATE THE VERIFIED REVIEW
    const review = await Review.create({
      user: req.user._id,
      property: propertyId,
      booking: bookingId,
      ratings: {
        cleanliness: Number(parsedRatings.cleanliness),
        maintenance: Number(parsedRatings.maintenance),
        safety: Number(parsedRatings.safety),
        services: Number(parsedRatings.services)
      },
      comment,
      images: reviewImages,
      safetySignals: parsedSignals,
      isVerifiedStay: true,
      authenticityScore: 100 // Default for verified bookings
    });

    // 4. 󾠱 UPDATE PROPERTY AGGREGATE RATING
    // We calculate the average of all 4 rating points across all reviews for this property
    const allReviews = await Review.find({ property: propertyId });
    
    const propertyTotalAvg = allReviews.reduce((acc, rev) => {
      const revAvg = (rev.ratings.cleanliness + rev.ratings.maintenance + 
                      rev.ratings.safety + rev.ratings.services) / 4;
      return acc + revAvg;
    }, 0) / allReviews.length;

    await Property.findByIdAndUpdate(propertyId, { 
      averageRating: propertyTotalAvg.toFixed(1) 
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    // Handle unique index error (User + Booking)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already submitted a review for this stay." });
    }
    next(error);
  }
};

// @desc    Get all reviews for a property
// @route   GET /api/v1/reviews/:propertyId
// @desc    Get all reviews for a property
export const getPropertyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ property: req.params.propertyId })
      .populate('user', 'firstName lastName avatar')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: reviews });
  } catch (error) { next(error); }
};

// @desc    Update an existing review
export const updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.reviewId);

    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    // Ensure only the author can edit
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Not authorized to edit this review" });
    }

    review = await Review.findByIdAndUpdate(req.params.reviewId, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: review });
  } catch (error) { next(error); }
};