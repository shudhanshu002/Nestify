import Property from '../models/property.model.js';

export const getFilteredProperties = async (query) => {
  // 󾠮 ADDED: 'search' (for property name/keyword)
  const { category, city, search, minPrice, maxPrice, lat, lng, maxDistance, verificationStatus } = query;
  
  let filter = {
    // 󾠯 THE HARD LOCK: Always strictly Verified for public
    verificationStatus: 'VERIFIED'
  };

  // 1. SMART KEYWORD SEARCH (Name or City)
  // If the user types "Matrix" or "Noida", we check both fields
  if (search || city) {
    const keyword = search || city;
    filter.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { 'location.city': { $regex: keyword, $options: 'i' } },
      { 'location.address': { $regex: keyword, $options: 'i' } }
    ];
  }

  // 2. Category Filter
  if (category && category !== 'all') {
    filter.category = category;
  }
  
  // 3. Price Range (Assuming basePrice is now in your Property Model)
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
  }

  // 4. GEOSPATIAL SEARCH (Map Search)
  if (lat && lng) {
    // If we are doing a Map search, we remove the City/Title filter 
    // to show everything within the physical radius of the map center
    delete filter.$or; 

    filter['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)], // [lng, lat]
        },
        // Increased to 15km to make sure seeded properties appear
        $maxDistance: parseInt(maxDistance) || 15000, 
      },
    };
  }

  // Final DB Query
  return await Property.find(filter).sort({ createdAt: -1 });
};

export const calculateMatchScore = (property) => {
  let score = 0;

  // 󾠮 Trust Factor (40 pts)
  if (property.isVerified) score += 25;
  if (property.owner?.kycStatus === 'VERIFIED') score += 15;

  // 󾠯 Safety & Tech (30 pts)
  const metrics = property.safetyMetrics || {};
  if (metrics.powerBackup) score += 10;
  if (metrics.cctv) score += 10;
  if (parseInt(metrics.internetSpeed) >= 100) score += 10;

  // 󾠰 User Feedback (30 pts)
  const rating = property.averageRating || 0;
  score += (rating / 5) * 30;

  return Math.min(Math.round(score), 100);
};