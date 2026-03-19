import * as propertyService from '../services/property.service.js';
import Room from '../models/room.model.js';
import Property from '../models/property.model.js';

// @desc    Create a new property (Owners/Admin only)
export const createProperty = async (req, res, next) => {
  try {
    // 1. Process uploaded files if they exist
    const images = req.files?.map(file => ({
      url: file.path,
      public_id: file.filename
    })) || [];

    // 2. Parse location (if sent as a stringified JSON from Frontend)
    const locationData = typeof req.body.location === 'string' 
      ? JSON.parse(req.body.location) 
      : req.body.location;

    // 3. Create property with Industry-Grade fields (Safety, Scores)
    const property = await Property.create({
      ...req.body,
      location: locationData,
      images,
      owner: req.user._id,
      // Default safety metrics from ER if not provided
      safetyMetrics: req.body.safetyMetrics || {
        noiseLevel: 'Low',
        internetSpeed: 'High-Speed WiFi',
        powerBackup: true
      }
    });

    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error("Property Creation Error:", error);
    next(error);
  }
};

// @desc    Add room to property
export const addRoomToProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const room = await Room.create({ ...req.body, property: propertyId });
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};

// @desc    Search properties with filters
export const searchProperties = async (req, res, next) => {
  try {
    const properties = await propertyService.getFilteredProperties(req.query);
    
    // THE FIX: Wrap in the 'data' object so the test can find it
    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};