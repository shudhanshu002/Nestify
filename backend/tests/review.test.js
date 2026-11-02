import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Review from '../src/models/review.model.js';

describe('Review & Ratings Suite', () => {
  const dummyUserId = new mongoose.Types.ObjectId();
  const dummyPropId = new mongoose.Types.ObjectId();
  const dummyBookingId = new mongoose.Types.ObjectId();

  it('should validate a complete and verified stay review', () => {
    const review = new Review({
      user: dummyUserId,
      property: dummyPropId,
      booking: dummyBookingId,
      ratings: {
        cleanliness: 5,
        maintenance: 4,
        safety: 5,
        services: 4
      },
      comment: 'Excellent stay at Nestify Prime! Super fast wifi and clean facilities.',
      safetySignals: {
        noiseLevel: 'Low',
        internetSpeed: 'Excellent',
        powerBackupReliability: true
      },
      isVerifiedStay: true,
      authenticityScore: 100
    });

    const err = review.validateSync();
    expect(err).toBeUndefined();
    expect(review.ratings.cleanliness).toBe(5);
    expect(review.isVerifiedStay).toBe(true);
    expect(review.authenticityScore).toBe(100);
  });

  it('should reject review when sub-ratings are below 1 or above 5', () => {
    const invalidLowReview = new Review({
      user: dummyUserId,
      property: dummyPropId,
      booking: dummyBookingId,
      ratings: {
        cleanliness: 0, // Below min 1
        maintenance: 4,
        safety: 5,
        services: 4
      },
      comment: 'Dirty'
    });
    const lowErr = invalidLowReview.validateSync();
    expect(lowErr).toBeDefined();
    expect(lowErr.errors['ratings.cleanliness']).toBeDefined();

    const invalidHighReview = new Review({
      user: dummyUserId,
      property: dummyPropId,
      booking: dummyBookingId,
      ratings: {
        cleanliness: 5,
        maintenance: 7, // Above max 5
        safety: 5,
        services: 4
      },
      comment: 'Too good'
    });
    const highErr = invalidHighReview.validateSync();
    expect(highErr).toBeDefined();
    expect(highErr.errors['ratings.maintenance']).toBeDefined();
  });

  it('should reject review if comment exceeds 1000 characters', () => {
    const longComment = 'a'.repeat(1005);
    const review = new Review({
      user: dummyUserId,
      property: dummyPropId,
      booking: dummyBookingId,
      ratings: {
        cleanliness: 4,
        maintenance: 4,
        safety: 4,
        services: 4
      },
      comment: longComment
    });

    const err = review.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.comment).toBeDefined();
  });
});
