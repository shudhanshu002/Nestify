import Property from '../models/property.model.js';
import Room from '../models/room.model.js';
import * as propertyService from '../services/property.service.js';
import Notification from '../models/notification.model.js';

// @desc    Create property (Building Shell)
export const createProperty = async (req, res, next) => {
  try {

    // 󾠮 LOCKDOWN: Prevent unverified users from even hitting the logic
    if (req.user.kycStatus !== 'VERIFIED') {
      return res.status(403).json({ 
        success: false, 
        message: "Identity Verification Required. Please complete your KYC in Profile settings." 
      });
    }


    const location = req.body.location ? JSON.parse(req.body.location) : undefined;
    const safetyMetrics = req.body.safetyMetrics ? JSON.parse(req.body.safetyMetrics) : undefined;
    const amenities = req.body.amenities ? JSON.parse(req.body.amenities) : [];

    // 1. Handle Multiple Images
    const images = req.files?.images?.map(file => ({
      url: file.path,
      public_id: file.filename
    })) || [];

    // 2. Handle Single Legal Document (NEW)
    const legalDocs = req.files?.legalDocument?.map(file => ({
      docType: 'OWNERSHIP_PROOF',
      fileUrl: file.path,
      uploadedAt: Date.now()
    })) || [];

    if (legalDocs.length === 0) {
      return res.status(400).json({ success: false, message: "Ownership document is mandatory." });
    }

    const property = await Property.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      genderPreference: req.body.genderPreference,
      tier: req.body.tier || 'FLAGSHIP',
      owner: req.user._id,
      location,
      amenities,
      safetyMetrics,
      images,
      legalDocuments: legalDocs, // 󾠮 SAVED HERE
      verificationStatus: 'PENDING' // 󾠯 LOCKED BY DEFAULT
    });

    res.status(201).json({
      success: true,
      message: "Building submitted. Admin will verify documents shortly.",
      propertyId: property._id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add room matrix (Inventory)
export const addRoomToProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // 1. Verify the Building Shell exists
    const parentProperty = await Property.findById(propertyId);
    if (!parentProperty) {
      return res.status(404).json({ success: false, message: "Building not found" });
    }

    // 2. Map uploaded files to the Schema format
    // These come from your 'upload.array("images", 4)' middleware
    const roomImages = req.files?.map(file => ({
      url: file.path,      // Cloudinary/Local Path
      public_id: file.filename
    })) || [];

    // 3. Parse and Sanitize the "Matrix" data
    const totalInventory = Number(req.body.totalInventory) || 1;
    
    // Safety check for amenities (parsed from stringified FormData)
    let amenities = [];
    if (req.body.amenities) {
      try {
        amenities = JSON.parse(req.body.amenities);
      } catch (e) {
        amenities = req.body.amenities.split(',').map(a => a.trim());
      }
    }

    // 4. Create the Room Inventory
    const room = await Room.create({
      property: propertyId,
      roomType: req.body.roomType || 'CLASSIC',
      basePrice: Number(req.body.basePrice),
      totalInventory,
      availableInventory: totalInventory, // Initially all units are free
      capacity: Number(req.body.capacity) || 1,
      roomSize: req.body.roomSize || '9 sqm approx',
      amenities,
      images: roomImages // 󾠮 CRITICAL: Images assigned here
    });

    res.status(201).json({
      success: true,
      message: `${room.roomType} inventory added successfully!`,
      data: room
    });
  } catch (error) {
    console.error("󾓮 ADD_ROOM_ERROR:", error.message);
    next(error);
  }
};

// Keep other controllers (searchProperties, getMyProperties, getPropertyById) as you have them.

// @desc    Search properties with filters
export const searchProperties = async (req, res, next) => {
  try {
    const query = { 
      ...req.query, 
      verificationStatus: 'VERIFIED' 
    };

    const properties = await propertyService.getFilteredProperties(query);
    
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


// @desc    Get all properties listed by the logged-in owner
// @route   GET /api/v1/properties/my-listings
// @access  Private/Owner
export const getMyProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).sort('-createdAt');
    const propIds = properties.map(p => p._id);
    const rooms = await Room.find({ property: { $in: propIds } });

    const data = properties.map(p => {
      const pObj = p.toObject();
      pObj.rooms = rooms.filter(r => r.property.toString() === p._id.toString());
      return pObj;
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error("Fetch My Listings Error:", error);
    next(error);
  }
};

import Booking from '../models/booking.model.js';

export const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query; // Get dates from the URL

    const property = await Property.findById(id).populate('owner', 'firstName lastName avatar');
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const isOwner = req.user?._id.toString() === property.owner._id.toString();
    const isAdmin = req.user?.role === 'ADMIN';

    if (property.verificationStatus !== 'VERIFIED' && !isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'This property is currently under review or has been rejected.' 
      });
    }

    const rooms = await Room.find({ property: id });

    // 󾠮 THE DYNAMIC MATRIX CALCULATION
    const roomsWithAvailability = await Promise.all(rooms.map(async (room) => {
      const start = checkIn ? new Date(checkIn) : new Date();
      start.setHours(0, 0, 0, 0);
      const end = checkOut ? new Date(checkOut) : new Date(start.getTime() + 86400000);
      end.setHours(0, 0, 0, 0);

      const overlaps = await Booking.countDocuments({
        room: room._id,
        status: { $in: ['CONFIRMED', 'CHECKED_IN'] },
        checkInDate: { $lt: end },
        checkOutDate: { $gt: start }
      });

      const currentAvailable = Math.max(0, room.totalInventory - overlaps);

      return {
        ...room._doc,
        availableUnitsForDates: currentAvailable // This is the "Truth" for these dates
      };
    }));

    res.json({
      success: true,
      data: { ...property._doc, rooms: roomsWithAvailability }
    });
  } catch (error) { next(error); }
};


export const getOwnerBookings = async (req, res, next) => {
  try {
    // 󾠮 DEBUG LOG: See who is asking for data
    console.log("Fetching bookings for Owner ID:", req.user._id);

    // 󾠯 Find properties owned by this user
    const properties = await Property.find({ owner: req.user._id });
    
    if (!properties || properties.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No properties found for this owner.",
        data: []
      });
    }

    const propertyIds = properties.map(p => p._id);
    console.log("Owner's Property IDs:", propertyIds);

    // 󾠰 Find all bookings where the 'property' field is in the owner's list
    const bookings = await Booking.find({ property: { $in: propertyIds } })
      .populate({
        path: 'property',
        select: 'title location images'
      })
      .populate({
        path: 'room',
        select: 'roomType basePrice'
      })
      .populate({
        path: 'tenant',
        select: 'firstName lastName email avatar'
      })
      .sort('-createdAt');

    console.log(`Found ${bookings.length} bookings for this owner.`);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error("GET_OWNER_BOOKINGS_ERROR:", error);
    next(error);
  }
};


// @desc    Get All Pending Properties (ADMIN ONLY)
export const getAdminPendingProperties = async (req, res, next) => {
  try {
    // 󾠮 Find properties with status PENDING
    const properties = await Property.find({ verificationStatus: 'PENDING' })
      .populate('owner', 'firstName lastName email')
      .sort('-createdAt');

    console.log(`󾓲 Admin Matrix: Found ${properties.length} pending properties.`);

    res.status(200).json({
      success: true,
      data: properties // 󾠯 This must be an array
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Property (ADMIN ONLY)
export const verifyProperty = async (req, res, next) => {
  try {
    const { status, reason, tier } = req.body;
    const property = await Property.findById(req.params.id);

    if (status) property.verificationStatus = status;
    if (tier && ['FLAGSHIP', 'LUXURY', 'BUDGET', 'STANDARD'].includes(tier)) {
      property.tier = tier;
    }
    if (status === 'REJECTED') property.rejectionReason = reason;
    await property.save();

    // 󾠮 Trigger Notification for the Owner
    await Notification.create({
      recipient: property.owner,
      title: status === 'VERIFIED' ? 'Building Approved! 🚀' : 'Action Required: Listing Rejected',
      message: status === 'VERIFIED' 
        ? `Great news! "${property.title}" is now live on the platform as a ${property.tier || 'FLAGSHIP'} stay.` 
        : `Your property "${property.title}" was rejected. Reason: ${reason}. Please update your documents.`,
      relatedId: property._id
    });

    res.status(200).json({ success: true, tier: property.tier });
  } catch (error) { next(error); }
};


export const resubmitPropertyDocs = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (property.owner.toString() !== req.user._id.toString()) return res.status(401).json({ message: "Unauthorized" });

    if (req.files?.legalDocument) {
      const newDocs = req.files.legalDocument.map(file => ({
        docType: 'OWNERSHIP_PROOF',
        fileUrl: file.path,
        uploadedAt: Date.now()
      }));
      
      property.legalDocuments = newDocs;
      property.verificationStatus = 'PENDING'; // Reset for Admin
      property.rejectionReason = ""; // Clear old reason
      await property.save();
      
      res.status(200).json({ success: true, message: "Documents re-submitted." });
    } else {
      res.status(400).json({ message: "No document uploaded." });
    }
  } catch (error) { next(error); }
};

// @desc    Update property tier (OWNER or ADMIN)
// @route   PATCH /api/v1/properties/:id/tier
export const updatePropertyTier = async (req, res, next) => {
  try {
    const { tier } = req.body;
    if (!['FLAGSHIP', 'LUXURY', 'BUDGET', 'STANDARD'].includes(tier)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid tier. Must be FLAGSHIP, LUXURY, BUDGET, or STANDARD." 
      });
    }

    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });

    // Ensure owner or admin
    if (req.user.role !== 'ADMIN' && property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this property tier" });
    }

    property.tier = tier;
    await property.save();

    res.status(200).json({
      success: true,
      message: `Property tier updated to ${tier}`,
      data: property
    });
  } catch (error) {
    next(error);
  }
};
