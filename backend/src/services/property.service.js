import Property from '../models/property.model.js';
import Room from '../models/room.model.js';

export const getFilteredProperties = async (query) => {
  const { 
    category, 
    city, 
    search, 
    minPrice, 
    maxPrice, 
    priceRange,
    lat, 
    lng, 
    maxDistance, 
    verificationStatus,
    gender,
    genderPreference,
    amenities,
    minRating,
    collection,
    sortBy,
    verifiedOnly
  } = query;
  
  let filter = {};

  // 1. Verification Status
  if (verifiedOnly === 'true' || verifiedOnly === true) {
    filter.verificationStatus = 'VERIFIED';
  } else if (verificationStatus) {
    filter.verificationStatus = verificationStatus;
  }

  // 2. Smart Keyword Search (Title, City, Address, State, Description)
  const keyword = (search || city || '').trim();
  if (keyword) {
    filter.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { 'location.city': { $regex: keyword, $options: 'i' } },
      { 'location.address': { $regex: keyword, $options: 'i' } },
      { 'location.state': { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } }
    ];
  }

  // 3. Category Filter (can be single or comma-separated)
  if (category && category !== 'all') {
    if (category.includes(',')) {
      filter.category = { $in: category.split(',').map(c => c.trim()) };
    } else {
      filter.category = category;
    }
  }

  // 4. Resident Gender Preference
  const targetGender = gender || genderPreference;
  if (targetGender && targetGender !== 'ALL' && targetGender !== 'all') {
    filter.genderPreference = { $in: [targetGender.toUpperCase(), 'UNISEX'] };
  }
  
  // 5. Price Range
  let min = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : null;
  let max = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : null;
  if (Array.isArray(priceRange)) {
    if (priceRange[0] !== undefined) min = Number(priceRange[0]);
    if (priceRange[1] !== undefined) max = Number(priceRange[1]);
  } else if (typeof priceRange === 'string' && priceRange.includes(',')) {
    const parts = priceRange.split(',');
    min = Number(parts[0]);
    max = Number(parts[1]);
  }

  if (min !== null || max !== null) {
    filter.basePrice = {};
    if (min !== null && !isNaN(min)) filter.basePrice.$gte = min;
    if (max !== null && !isNaN(max) && max > 0) filter.basePrice.$lte = max;
    if (Object.keys(filter.basePrice).length === 0) delete filter.basePrice;
  }

  // 6. Amenities Filter (matches properties having the requested amenities)
  let amenitiesList = [];
  if (Array.isArray(amenities)) {
    amenitiesList = amenities.filter(Boolean);
  } else if (typeof amenities === 'string' && amenities.trim()) {
    amenitiesList = amenities.split(',').map(a => a.trim()).filter(Boolean);
  }
  if (amenitiesList.length > 0) {
    filter.amenities = { $in: amenitiesList };
  }

  // 7. Minimum Guest Rating
  if (minRating) {
    const numRating = Number(minRating);
    if (!isNaN(numRating) && numRating > 0) {
      filter.averageRating = { $gte: numRating };
    }
  }

  // 8. OYO Tier / Collection (Matches explicit property.tier with fallback)
  const targetTier = (query.tier || collection || '').toUpperCase();
  if (targetTier) {
    if (['FLAGSHIP', 'LUXURY', 'BUDGET', 'STANDARD'].includes(targetTier)) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { tier: targetTier },
          ...(targetTier === 'LUXURY' ? [{ basePrice: { $gte: 12000 } }] : []),
          ...(targetTier === 'BUDGET' ? [{ basePrice: { $lte: 8500 } }] : []),
          ...(targetTier === 'FLAGSHIP' ? [{ averageRating: { $gte: 4.2 } }] : [])
        ]
      });
    }
  }

  // 9. Geospatial Search (Map Search)
  if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
    delete filter.$or; // Map takes spatial precedence over text search
    filter['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(maxDistance) || 25000, 
      },
    };
  }

  // 10. Sort Order
  let sortCriteria = { averageRating: -1, createdAt: -1 };
  if (sortBy === 'price_asc' || sortBy === 'price_low') {
    sortCriteria = { basePrice: 1 };
  } else if (sortBy === 'price_desc' || sortBy === 'price_high') {
    sortCriteria = { basePrice: -1 };
  } else if (sortBy === 'rating_desc' || sortBy === 'rating') {
    sortCriteria = { averageRating: -1 };
  } else if (sortBy === 'newest') {
    sortCriteria = { createdAt: -1 };
  }

  // 11. Execute DB Query with Owner populated
  let properties;
  try {
    properties = await Property.find(filter)
      .populate('owner', 'firstName lastName avatar kycStatus')
      .sort(sortCriteria);
  } catch (err) {
    // If geospatial query fails (e.g. index issue), fallback without geo filter
    if (filter['location.coordinates']) {
      delete filter['location.coordinates'];
      properties = await Property.find(filter)
        .populate('owner', 'firstName lastName avatar kycStatus')
        .sort(sortCriteria);
    } else {
      throw err;
    }
  }

  // 12. Attach Room Inventories to each Property
  if (properties.length > 0) {
    const propIds = properties.map(p => p._id);
    const rooms = await Room.find({ property: { $in: propIds } });
    
    return properties.map(p => {
      const pObj = p.toObject();
      pObj.rooms = rooms.filter(r => r.property.toString() === p._id.toString());
      return pObj;
    });
  }

  return [];
};

export const calculateMatchScore = (property) => {
  let score = 0;

  // 1. Trust Factor (40 pts)
  if (property.isVerified) score += 25;
  if (property.owner?.kycStatus === 'VERIFIED') score += 15;

  // 2. Safety & Tech (30 pts)
  const metrics = property.safetyMetrics || {};
  if (metrics.powerBackup) score += 10;
  if (metrics.cctv) score += 10;
  if (parseInt(metrics.internetSpeed) >= 100) score += 10;

  // 3. User Feedback (30 pts)
  const rating = property.averageRating || 0;
  score += (rating / 5) * 30;

  return Math.min(Math.round(score), 100);
};
