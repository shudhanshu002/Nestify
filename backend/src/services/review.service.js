import Review from '../models/review.model.js';
import Property from '../models/property.model.js';


// Internal helper to update Property average ratings and safety metrics

const updatePropertyAggregates = async (propertyId) => {
  const stats = await Review.aggregate([
    { $match: { property: propertyId } },
    {
      $group: {
        _id: '$property',
        avgRating: { 
          $avg: { 
            $divide: [
              { $add: ["$ratings.cleanliness", "$ratings.maintenance", "$ratings.safety", "$ratings.services"] }, 
              4
            ] 
          }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Property.findByIdAndUpdate(propertyId, {
      averageRating: stats[0].avgRating.toFixed(1),
      reviewCount: stats[0].count
    });
  }
};


// Adds a review and recalculates property scores
 
export const createReview = async (reviewData) => {
  const review = await Review.create(reviewData);

  // Trigger Score Recalculation (Async)
  updatePropertyAggregates(reviewData.property);

  return review;
};