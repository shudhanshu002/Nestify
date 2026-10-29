import Booking from '../models/booking.model.js';
import Maintenance from '../models/maintenance.model.js';
import Property from '../models/property.model.js';

export const getOwnerAnalytics = async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user._id });
    const propertyIds = properties.map(p => p._id);

    // 1. Get Open Tickets for this owner's properties
    const tickets = await Maintenance.find({ 
      property: { $in: propertyIds }, 
      status: { $ne: 'RESOLVED' } 
    }).populate('tenant', 'firstName lastName email').populate('property', 'title');

    // 2. Total Revenue (Sum of all completed/checked_in bookings)
    const revenueData = await Booking.aggregate([
      { $match: { property: { $in: propertyIds }, status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    res.status(200).json({
      success: true,
      revenue: revenueData[0]?.total || 0,
      tickets
    });
  } catch (error) { next(error); }
};