import Maintenance from '../models/maintenance.model.js';
import Booking from '../models/booking.model.js';
import Property from '../models/property.model.js';
import Notification from '../models/notification.model.js';

// @desc    Raise a maintenance ticket
// @route   POST /api/v1/maintenance
export const createTicket = async (req, res, next) => {
  try {
    const { propertyId, bookingId, issueType, description, priority } = req.body;

    if (!issueType || !description) {
      return res.status(400).json({ 
        success: false, 
        message: "Issue type and description are required." 
      });
    }

    // 1. Check if user is currently CHECKED_IN for this booking/room
    let activeStay = null;

    if (bookingId) {
      activeStay = await Booking.findOne({
        _id: bookingId,
        tenant: req.user._id,
        status: 'CHECKED_IN'
      }).populate('property').populate('room');
    }

    // Fallback: look by property if bookingId wasn't passed or to ensure stay
    if (!activeStay && propertyId) {
      activeStay = await Booking.findOne({
        property: propertyId,
        tenant: req.user._id,
        status: 'CHECKED_IN'
      }).populate('property').populate('room');
    }

    // Strict Rule: ONLY allowed if the user is currently checked into that room
    if (!activeStay) {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: You can only raise maintenance requests for bookings where you are currently CHECKED_IN." 
      });
    }

    const resolvedPropertyId = activeStay.property?._id || propertyId;
    const resolvedRoomId = activeStay.room?._id || activeStay.room;

    // 2. Create the Maintenance Ticket
    let ticket = await Maintenance.create({
      property: resolvedPropertyId,
      tenant: req.user._id,
      room: resolvedRoomId,
      booking: activeStay._id,
      issueType,
      description,
      priority: priority || 'MEDIUM',
      status: 'OPEN'
    });

    // Populate for socket and response
    ticket = await Maintenance.findById(ticket._id)
      .populate('property', 'title location owner images')
      .populate('tenant', 'firstName lastName email avatar')
      .populate('room', 'roomType roomNumber');

    // 3. Notify Owner with Ticket ID, User name, and Related PG details
    const ownerId = ticket.property?.owner?._id || ticket.property?.owner;
    const ticketShortId = `#${ticket._id.toString().slice(-6).toUpperCase()}`;
    const pgTitle = ticket.property?.title || 'Property';
    const roomInfo = ticket.room?.roomNumber ? `Room ${ticket.room.roomNumber}` : (ticket.room?.roomType ? `Unit: ${ticket.room.roomType}` : '');
    const tenantName = `${req.user.firstName} ${req.user.lastName}`.trim();

    let ownerNotification = null;
    if (ownerId) {
      ownerNotification = await Notification.create({
        recipient: ownerId,
        title: `New Maintenance Ticket ${ticketShortId}`,
        message: `Tenant ${tenantName} raised a ${issueType} issue ("${description}") for ${pgTitle}${roomInfo ? ` (${roomInfo})` : ''}. Ticket ID: ${ticket._id}`,
        type: 'MAINTENANCE',
        relatedId: ticket._id
      });
    }

    // 4. Real-time Live Emit to Owner
    const io = req.app.get('io');
    if (io && ownerId) {
      const ownerRoom = ownerId.toString();
      // Live event so owner doesn't need to refresh the page
      io.to(ownerRoom).emit('new_maintenance_ticket', ticket);
      if (ownerNotification) {
        io.to(ownerRoom).emit('notification', ownerNotification);
        io.to(ownerRoom).emit('unread_notification_count_changed');
      }
    }

    res.status(201).json({ 
      success: true, 
      message: "Maintenance ticket raised successfully. The owner has been notified.",
      data: ticket 
    });
  } catch (error) { 
    next(error); 
  }
};

// @desc    TENANT: See my own queries for a specific property or all
// @route   GET /api/v1/maintenance/my-tickets or /api/v1/maintenance/my-tickets/:propertyId
export const getMyTickets = async (req, res, next) => {
  try {
    const filter = { tenant: req.user._id };
    if (req.params.propertyId) {
      filter.property = req.params.propertyId;
    }

    const tickets = await Maintenance.find(filter)
      .populate('property', 'title location')
      .populate('room', 'roomType roomNumber')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) { 
    next(error); 
  }
};

// @desc    OWNER/MANAGER: Respond to a query & mark as resolved
// @route   PATCH /api/v1/maintenance/:id/respond
export const respondToTicket = async (req, res, next) => {
  try {
    const { status, resolutionNote } = req.body;

    const ticket = await Maintenance.findById(req.params.id)
      .populate('property', 'title owner location')
      .populate('tenant', 'firstName lastName email')
      .populate('room', 'roomType roomNumber');

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Security check: only property owner or admin can update
    const isOwner = ticket.property?.owner?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this ticket" });
    }

    if (status) ticket.status = status;
    if (resolutionNote !== undefined) ticket.resolutionNote = resolutionNote;
    if (status === 'RESOLVED') {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    // Notify User when ticket is solved/resolved
    const io = req.app.get('io');
    const ticketShortId = `#${ticket._id.toString().slice(-6).toUpperCase()}`;

    if (status === 'RESOLVED' && ticket.tenant) {
      const tenantId = (ticket.tenant._id || ticket.tenant).toString();
      const pgTitle = ticket.property?.title || 'your PG';

      const userNotification = await Notification.create({
        recipient: tenantId,
        title: `Ticket ${ticketShortId} Solved`,
        message: `Your maintenance ticket ${ticketShortId} for ${pgTitle} has been solved. Manager reply: "${ticket.resolutionNote || 'The issue has been resolved.'}". Ticket ID: ${ticket._id}`,
        type: 'MAINTENANCE',
        relatedId: ticket._id
      });

      if (io) {
        io.to(tenantId).emit('ticket_resolved', {
          ticketId: ticket._id,
          ticketShortId,
          status: 'RESOLVED',
          resolutionNote: ticket.resolutionNote,
          ticket
        });
        io.to(tenantId).emit('notification', userNotification);
        io.to(tenantId).emit('unread_notification_count_changed');
      }
    }

    // Also broadcast ticket update to owner
    if (io && ticket.property?.owner) {
      io.to(ticket.property.owner.toString()).emit('ticket_updated', ticket);
    }

    res.status(200).json({ 
      success: true, 
      message: status === 'RESOLVED' ? "Ticket resolved and tenant notified successfully." : "Ticket updated.",
      data: ticket 
    });
  } catch (error) { 
    next(error); 
  }
};

// @desc    ADMIN: See all tickets across the platform
// @route   GET /api/v1/maintenance/admin/all
export const getAdminTickets = async (req, res, next) => {
  try {
    const tickets = await Maintenance.find()
      .populate('property', 'title location')
      .populate('tenant', 'firstName lastName email')
      .populate('room', 'roomType roomNumber')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) { 
    next(error); 
  }
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
      property: { $in: propertyIds }
    })
    .populate('property', 'title location owner images')
    .populate('tenant', 'firstName lastName email avatar')
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
    if (feedback) ticket.userFeedback = feedback;
    await ticket.save();

    res.status(200).json({ success: true, message: "Thank you for your feedback!", data: ticket });
  } catch (error) { 
    next(error); 
  }
};
