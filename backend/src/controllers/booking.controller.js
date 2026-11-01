import Booking from '../models/booking.model.js';
import Room from '../models/room.model.js';
import Property from '../models/property.model.js';
import Notification from '../models/notification.model.js';
import Payment from '../models/payment.model.js';

/**
 * Standardized Date-Interval Conflict Utility
 * Validates availability across [checkIn, checkOut) against room.totalInventory
 * Enforces strict per-night concurrency checking to guarantee ZERO overbooking.
 */
export const getAvailableCountForDates = async (roomId, checkIn, checkOut, totalInventory, excludeBookingId = null) => {
  const start = new Date(checkIn);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);

  if (end <= start) return 0;

  const query = {
    room: roomId,
    status: { $in: ['CONFIRMED', 'CHECKED_IN'] },
    checkInDate: { $lt: end },
    checkOutDate: { $gt: start }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const overlappingBookings = await Booking.find(query).select('checkInDate checkOutDate');

  // Exact per-night slot concurrency check: verify every single night in the requested range
  let maxOccupancyInSlot = 0;
  const cursor = new Date(start);

  while (cursor < end) {
    const nextCursor = new Date(cursor.getTime() + 86400000);
    
    // Booking occupies night [cursor, nextCursor) if checkIn < nextCursor and checkOut > cursor
    const occupiedOnThisNight = overlappingBookings.filter(b => {
      const bStart = new Date(b.checkInDate);
      bStart.setHours(0, 0, 0, 0);
      const bEnd = new Date(b.checkOutDate);
      bEnd.setHours(0, 0, 0, 0);
      return bStart < nextCursor && bEnd > cursor;
    }).length;

    if (occupiedOnThisNight > maxOccupancyInSlot) {
      maxOccupancyInSlot = occupiedOnThisNight;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  const available = totalInventory - maxOccupancyInSlot;
  return Math.max(0, available);
};

// @desc    Check availability for specific dates
// @route   POST /api/v1/bookings/initiate
export const initiateBooking = async (req, res, next) => {
  try {
    const { roomId, checkInDate, checkOutDate } = req.body;
    const room = await Room.findById(roomId);

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const availableUnits = await getAvailableCountForDates(
      roomId, 
      checkInDate, 
      checkOutDate, 
      room.totalInventory
    );

    if (availableUnits <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Sold Out! All ${room.totalInventory} units of this room type are booked for the selected dates.` 
      });
    }

    res.status(200).json({
      success: true,
      availableUnits,
      totalInventory: room.totalInventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new booking with conflict protection
// @route   POST /api/v1/bookings
export const createBooking = async (req, res, next) => {
  try {
    const { property, room, checkInDate, checkOutDate, totalAmount } = req.body;

    // 1. Get room details
    const roomDoc = await Room.findById(room).populate('property');
    if (!roomDoc) return res.status(404).json({ success: false, message: "Room not found" });

    // 2. Conflict Management: Check overlapping bookings
    const availableUnits = await getAvailableCountForDates(
      room, 
      checkInDate, 
      checkOutDate, 
      roomDoc.totalInventory
    );

    // 3. Block if all units are booked (e.g. 5 total, 5 booked -> 0 available)
    if (availableUnits <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Sold Out! All ${roomDoc.totalInventory} rooms of this type are already booked for the selected dates.` 
      });
    }

    // 4. Create Booking
    const booking = await Booking.create({
      tenant: req.user._id,
      property,
      room,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      totalAmount,
      status: 'CONFIRMED',
      paymentStatus: 'PAID'
    });

    // 4.1 Record Initial Ledger Payment Transaction
    try {
      const initTxnId = `TXN-INIT-${booking._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const platformFee = Math.round(totalAmount * 0.10);
      await Payment.create({
        booking: booking._id,
        transactionId: initTxnId,
        gateway: 'RAZORPAY',
        amount: totalAmount,
        currency: 'INR',
        platformFee,
        ownerSettlementAmount: totalAmount - platformFee,
        status: 'COMPLETED',
        settlementStatus: 'UNSETTLED'
      });
    } catch (payErr) {
      console.warn("Could not record initial payment record:", payErr.message);
    }

    // 5. Update room snapshot
    roomDoc.availableInventory = Math.max(0, availableUnits - 1);
    await roomDoc.save();

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error("OVERLAP_PROTECTION_FAILED:", error);
    next(error);
  }
};

// @desc    Check availability for extending a stay (CHECKED_IN or CONFIRMED)
// @route   GET or POST /api/v1/bookings/:id/check-extend
export const checkExtensionAvailability = async (req, res, next) => {
  try {
    const newCheckOutDate = req.query.newCheckOutDate || req.body.newCheckOutDate;
    if (!newCheckOutDate) {
      return res.status(400).json({ success: false, message: "New check-out date is required" });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('property');

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Security: Only the tenant or platform admin
    if (booking.tenant.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Unauthorized to extend this booking" });
    }

    // Condition: User must be currently checked in or confirmed
    if (!['CHECKED_IN', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Stay extension is only available for active or confirmed stays." 
      });
    }

    const currentCheckOut = new Date(booking.checkOutDate);
    const targetCheckOut = new Date(newCheckOutDate);
    targetCheckOut.setHours(0, 0, 0, 0);
    currentCheckOut.setHours(0, 0, 0, 0);

    if (targetCheckOut <= currentCheckOut) {
      return res.status(400).json({ 
        success: false, 
        message: "New check-out date must be after your current check-out date." 
      });
    }

    const roomDoc = booking.room;
    if (!roomDoc) {
      return res.status(404).json({ success: false, message: "Room details not found" });
    }

    // Calculate additional days and pricing
    const additionalDays = Math.max(1, Math.ceil((targetCheckOut - currentCheckOut) / (1000 * 60 * 60 * 24)));
    const dailyRate = roomDoc.basePrice || Math.round(booking.totalAmount / 30);
    const additionalAmount = additionalDays * dailyRate;

    // Check availability during the extended window, excluding this booking
    const availableUnits = await getAvailableCountForDates(
      roomDoc._id,
      currentCheckOut,
      targetCheckOut,
      roomDoc.totalInventory,
      booking._id
    );

    const payload = {
      available: availableUnits > 0,
      availableUnits,
      totalInventory: roomDoc.totalInventory,
      currentCheckOutDate: booking.checkOutDate,
      newCheckOutDate: targetCheckOut,
      additionalDays,
      dailyRate,
      additionalAmount,
      newTotalAmount: booking.totalAmount + additionalAmount
    };

    res.status(200).json({
      success: true,
      ...payload,
      data: payload
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Extend stay check-out date and record payment (CHECKED_IN or CONFIRMED)
// @route   POST /api/v1/bookings/:id/extend
export const extendStay = async (req, res, next) => {
  try {
    const newCheckOutDate = req.body.newCheckOutDate || req.query.newCheckOutDate;
    if (!newCheckOutDate) {
      return res.status(400).json({ success: false, message: "New check-out date is required" });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('property')
      .populate('tenant', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.tenant._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Must be currently checked in or confirmed
    if (!['CHECKED_IN', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Stay extension is only available for active or confirmed stays." 
      });
    }

    const currentCheckOut = new Date(booking.checkOutDate);
    const targetCheckOut = new Date(newCheckOutDate);
    targetCheckOut.setHours(0, 0, 0, 0);
    currentCheckOut.setHours(0, 0, 0, 0);

    if (targetCheckOut <= currentCheckOut) {
      return res.status(400).json({ 
        success: false, 
        message: "New check-out date must be later than your current check-out date." 
      });
    }

    const roomDoc = booking.room;
    const additionalDays = Math.max(1, Math.ceil((targetCheckOut - currentCheckOut) / (1000 * 60 * 60 * 24)));
    const dailyRate = roomDoc.basePrice || Math.round(booking.totalAmount / 30);
    const additionalAmount = additionalDays * dailyRate;

    // Strict overlap check on the extension window
    const availableUnits = await getAvailableCountForDates(
      roomDoc._id,
      currentCheckOut,
      targetCheckOut,
      roomDoc.totalInventory,
      booking._id
    );

    if (availableUnits <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Extension unavailable! All ${roomDoc.totalInventory} rooms of this type are booked for the requested extension period.` 
      });
    }

    // 5. Generate Extension Ledger Transaction
    const extTransactionId = `TXN-EXT-${booking._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const platformFee = Math.round(additionalAmount * 0.10);
    try {
      await Payment.create({
        booking: booking._id,
        transactionId: extTransactionId,
        gateway: 'RAZORPAY',
        amount: additionalAmount,
        currency: 'INR',
        platformFee,
        ownerSettlementAmount: additionalAmount - platformFee,
        status: 'COMPLETED',
        settlementStatus: 'UNSETTLED'
      });
    } catch (payErr) {
      console.warn("Could not record extension payment transaction:", payErr.message);
    }

    // 6. Record extension in audit log
    booking.extensions = booking.extensions || [];
    booking.extensions.push({
      extendedAt: new Date(),
      previousCheckOutDate: currentCheckOut,
      newCheckOutDate: targetCheckOut,
      additionalDays,
      additionalAmount,
      paymentStatus: 'PAID',
      transactionId: extTransactionId
    });

    // 7. Update checkOutDate and totalAmount
    booking.checkOutDate = targetCheckOut;
    booking.totalAmount += additionalAmount;
    await booking.save();

    // 8. Update room cached inventory
    roomDoc.availableInventory = Math.max(0, availableUnits - 1);
    await roomDoc.save();

    // 9. Notify Owner
    const propOwnerId = booking.property?.owner?._id || booking.property?.owner;
    if (propOwnerId) {
      await Notification.create({
        recipient: propOwnerId,
        title: 'Stay Extended! 📅',
        message: `Guest ${booking.tenant?.firstName || 'Tenant'} has extended their stay at "${booking.property?.title}" until ${targetCheckOut.toLocaleDateString()}. Additional rent paid: ₹${additionalAmount.toLocaleString()}. Transaction ID: ${extTransactionId}`,
        relatedId: booking._id
      });
    }

    // 10. Notify Tenant
    await Notification.create({
      recipient: booking.tenant._id,
      title: 'Stay Extended Successfully! ✅',
      message: `Your stay at "${booking.property?.title}" has been successfully extended by ${additionalDays} days until ${targetCheckOut.toLocaleDateString()}. Transaction ID: ${extTransactionId}`,
      relatedId: booking._id
    });

    // 11. Return fully populated fresh booking
    const updatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'property',
        select: 'title location address images owner category',
        populate: {
          path: 'owner',
          select: 'firstName lastName email phone'
        }
      })
      .populate('room', 'roomType roomNumber basePrice totalInventory')
      .populate('tenant', 'firstName lastName email avatar phone');

    res.status(200).json({
      success: true,
      message: `Stay extended by ${additionalDays} days until ${targetCheckOut.toLocaleDateString()}.`,
      data: updatedBooking,
      transactionId: extTransactionId
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ tenant: req.user._id })
      .populate({
        path: 'property',
        select: 'title owner images location address category',
        populate: { 
          path: 'owner',
          select: '_id firstName lastName role email phone' 
        }
      })
      .populate('room', 'roomType roomNumber basePrice totalInventory')
      .populate('tenant', 'firstName lastName email phone avatar')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for properties owned by the logged-in user
// @route   GET /api/v1/bookings/owner-bookings
export const getOwnerBookings = async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const bookings = await Booking.find({ property: { $in: propertyIds } })
      .populate({
        path: 'property',
        select: 'title location address images owner category',
        populate: {
          path: 'owner',
          select: 'firstName lastName email phone'
        }
      })
      .populate('room', 'roomType roomNumber basePrice totalInventory')
      .populate('tenant', 'firstName lastName email avatar phone')
      .sort('-checkInDate');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Booking Status (Check-in / Check-out / Cancel)
// @route   PATCH /api/v1/bookings/:id/status
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, actualDate } = req.body; 
    const booking = await Booking.findById(req.params.id).populate('property');

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // Security: Owner check
    if (booking.property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const now = new Date();
    const selectedDate = new Date(actualDate || now);

    // Prevent Check-in if the date is too far ahead
    if (status === 'CHECKED_IN') {
      const hoursUntilCheckIn = (new Date(booking.checkInDate) - now) / (1000 * 60 * 60);
      if (hoursUntilCheckIn > 24) {
        return res.status(400).json({ 
          success: false, 
          message: `Too Early! Check-in is only allowed within 24 hours of the scheduled date (${new Date(booking.checkInDate).toLocaleDateString()}).` 
        });
      }
      booking.actualCheckInDate = selectedDate;
    }

    // Record Actual Check-out
    if (status === 'COMPLETED') {
      booking.actualCheckOutDate = selectedDate;
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({ success: true, message: `Guest ${status} successfully.`, data: booking });
  } catch (error) { next(error); }
};

// @desc    Get detailed official receipt for a booking
// @route   GET /api/v1/bookings/:id/receipt
export const getBookingReceipt = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'property',
        select: 'title location address images owner category',
        populate: {
          path: 'owner',
          select: 'firstName lastName email phone'
        }
      })
      .populate('room', 'roomType roomNumber basePrice totalInventory')
      .populate('tenant', 'firstName lastName email avatar phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isTenant = booking.tenant?._id?.toString() === req.user._id.toString();
    const isOwner = booking.property?.owner?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTenant && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to access this receipt' });
    }

    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const totalStayDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Extensions calculations
    const extensions = booking.extensions || [];
    const totalExtensionAmount = extensions.reduce((sum, ext) => sum + (ext.additionalAmount || 0), 0);
    const totalExtensionDays = extensions.reduce((sum, ext) => sum + (ext.additionalDays || 0), 0);
    const initialStayDays = Math.max(1, totalStayDays - totalExtensionDays);
    const initialTotalAmount = Math.max(0, (booking.totalAmount || 0) - totalExtensionAmount);

    const totalAmount = booking.totalAmount || 0;
    const baseTariff = Math.round((totalAmount * 0.88) * 100) / 100;
    const initialBaseTariff = Math.round((initialTotalAmount * 0.88) * 100) / 100;
    const totalTax = Math.round((totalAmount - baseTariff) * 100) / 100;
    const cgst = Math.round((totalTax / 2) * 100) / 100;
    const sgst = Math.round((totalTax - cgst) * 100) / 100;

    const receiptNumber = `RCP-${booking._id.toString().slice(-8).toUpperCase()}`;
    const defaultTxnId = `TXN-${booking._id.toString().slice(-6).toUpperCase()}-${new Date(booking.createdAt).getTime().toString().slice(-6)}`;

    // Query ledger payments
    const dbPayments = await Payment.find({ booking: booking._id }).sort('createdAt');
    let transactions = dbPayments.map(p => ({
      transactionId: p.transactionId,
      amount: p.amount,
      gateway: p.gateway,
      status: p.status,
      type: p.transactionId?.includes('EXT') ? 'STAY_EXTENSION' : 'INITIAL_RESERVATION',
      createdAt: p.createdAt
    }));

    if (transactions.length === 0) {
      // Synthesize if missing in payment ledger for legacy entries
      transactions = [
        {
          transactionId: defaultTxnId,
          amount: initialTotalAmount,
          gateway: 'RAZORPAY',
          status: 'COMPLETED',
          type: 'INITIAL_RESERVATION',
          createdAt: booking.createdAt
        },
        ...extensions.map(ext => ({
          transactionId: ext.transactionId || `TXN-EXT-${booking._id.toString().slice(-6).toUpperCase()}-${new Date(ext.extendedAt).getTime().toString().slice(-6)}`,
          amount: ext.additionalAmount,
          gateway: 'RAZORPAY',
          status: 'COMPLETED',
          type: 'STAY_EXTENSION',
          createdAt: ext.extendedAt
        }))
      ];
    }

    res.status(200).json({
      success: true,
      data: {
        booking,
        receiptNumber,
        transactionId: transactions[0]?.transactionId || defaultTxnId,
        transactions,
        issuedAt: booking.createdAt,
        lastUpdatedAt: booking.updatedAt,
        paymentStatus: booking.paymentStatus || 'PAID',
        paymentMethod: 'PREPAID_ONLINE_GATEWAY',
        stayDurationDays: totalStayDays,
        initialStayDays,
        initialTotalAmount,
        initialBaseTariff,
        totalExtensionAmount,
        totalExtensionDays,
        extensions,
        pricing: {
          baseTariff,
          initialBaseTariff,
          taxesAndFees: totalTax,
          cgst,
          sgst,
          totalAmount,
          currency: 'INR',
          amountPaid: totalAmount,
          balanceDue: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
