import Property from '../models/property.model.js';

export const getFilteredProperties = async (query) => {
  const { category, city, minPrice, maxPrice, lat, lng, maxDistance } = query;
  
  let filter = {};

  // 1. Basic Filters
  if (category) filter.category = category;
  if (city) filter['location.city'] = new RegExp(city, 'i');
  
  // 2. Price Range
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
  }

  // 3. Geospatial Search (Only if lat/lng are provided)
  if (lat && lng) {
    filter['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(maxDistance) || 5000, // Default 5km
      },
    };
  }

  return await Property.find(filter).sort({ createdAt: -1 });
};