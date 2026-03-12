import * as propertyService from '../services/property.service.js';
import Room from '../models/room.model.js';

// @desc    Create a new property (Owners/Admin only)
export const createProperty = async (req, res, next) => {
  try {
    const propertyData = { ...req.body, owner: req.user._id };
    const property = await propertyService.createNewProperty(propertyData);
    res.status(201).json(property);
  } catch (error) {
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
    res.json(properties);
  } catch (error) {
    next(error);
  }
};