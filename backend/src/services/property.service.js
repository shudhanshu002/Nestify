import Property from "../models/property.model";

export const createNewProperty = async (propertyData) => {
  return await Property.create(propertyData);
};

export const getFilteredProperties = async (filters) => {
  const query = {};
  
  if (filters.category) query.category = filters.category;
  if (filters.genderPreference) query.genderPreference = filters.genderPreference;
  if (filters.maxPrice) query.basePrice = { $lte: filters.maxPrice };
  
  return await Property.find(query).populate('owner', 'firstName lastName');
};

export const findNearbyProperties = async (lng, lat, maxDistanceInKm) => {
  return await Property.find({
    "location.coordinates": {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: maxDistanceInKm * 1000 // Convert km to meters
      }
    }
  });
};