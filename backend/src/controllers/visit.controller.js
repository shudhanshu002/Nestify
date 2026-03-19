import PropertyVisit from '../models/visit.model.js';
import Property from '../models/property.model.js';

export const scheduleVisit = async (req, res, next) => {
  try {
    const { propertyId, visitDate, notes } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const visit = await PropertyVisit.create({
      property: propertyId,
      visitor: req.user._id,
      owner: property.owner,
      visitDate,
      notes
    });

    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
};

export const updateVisitStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // APPROVED, CANCELLED, etc.
    const visit = await PropertyVisit.findById(req.params.id);

    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    // Only the owner or the visitor can change status
    if (visit.owner.toString() !== req.user._id.toString() && 
        visit.visitor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    visit.status = status;
    await visit.save();

    res.json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
};