import Maintenance from '../models/maintenance.model.js';
import Booking from '../models/booking.model.js';
import Property from '../models/property.model.js';

// @desc    Raise a maintenance ticket
// @route   POST /api/v1/maintenance
export const createTicket = async (req, res, next) => {
  try {
    const { propertyId, issueType, description, priority } = req.body;

    // 1. Check if user is currently CHECKED_IN
    const activeStay = await Booking.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: 'CHECKED_IN'
    });

    if (!activeStay) {
      return res.status(403).json({ success: false, message: "Maintenance requests only available during your stay." });
    }

    const ticket = await Maintenance.create({
      property: propertyId,
      tenant: req.user._id,
      room: activeStay.room,
      issueType,
      description,
      priority: priority || 'MEDIUM'
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) { next(error); }
};


// 1. TENANT: See my own queries for a specific property
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Maintenance.find({ 
      tenant: req.user._id, 
      property: req.params.propertyId 
    }).sort('-createdAt');
    res.status(200).json({ success: true, data: tickets });
  } catch (error) { next(error); }
};

// 2. OWNER/MANAGER: Respond to a query
export const respondToTicket = async (req, res, next) => {
  try {
    const { status, resolutionNote } = req.body;
    const ticket = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { status, resolutionNote, resolvedAt: status === 'RESOLVED' ? Date.now() : null },
      { new: true }
    );
    res.status(200).json({ success: true, data: ticket });
  } catch (error) { next(error); }
};

// 3. ADMIN: See all tickets across the platform
export const getAdminTickets = async (req, res, next) => {
  try {
    const tickets = await Maintenance.find()
      .populate('property', 'title')
      .populate('tenant', 'firstName lastName')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: tickets });
  } catch (error) { next(error); }
};

// @desc    Get all maintenance tickets for properties owned by the logged-in user
// @route   GET /api/v1/maintenance/owner/all
export const getOwnerTickets = async (req, res, next) => {
  try {
    // 1. Find properties owned by this owner
    const myProperties = await Property.find({ owner: req.user._id }).select('_id');
    const propertyIds = myProperties.map(p => p._id);

    // 2. Find tickets linked to those properties
    const tickets = await Maintenance.find({ 
      property: { $in: propertyIds },
    //   status: { $ne: 'RESOLVED' } // Only show active issues
    })
    .populate('tenant', 'firstName lastName email')
    .populate('room', 'roomType roomNumber')
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Tenant rates the maintenance resolution
// @route   PATCH /api/v1/maintenance/:id/rate
export const rateMaintenanceTicket = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const ticket = await Maintenance.findById(req.params.id);

    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    if (ticket.status !== 'RESOLVED') return res.status(400).json({ success: false, message: "Can only rate resolved tickets" });

    ticket.userRating = rating;
    ticket.userFeedback = feedback;
    await ticket.save();

    res.status(200).json({ success: true, message: "Thank you for your feedback!" });
  } catch (error) { next(error); }
};