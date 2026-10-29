export const escalateDispute = async (req, res, next) => {
  try {
    const { disputeId } = req.params;
    const dispute = await Dispute.findById(disputeId);

    if (dispute.resolutionLevel === 'MANAGER') {
      // 󾠮 Escalate to Company Admin
      dispute.resolutionLevel = 'COMPANY_ADMIN';
      dispute.status = 'ESCALATED_TO_COMPANY';
    } else if (dispute.resolutionLevel === 'COMPANY_ADMIN') {
      // 󾠯 Escalate to YOU (Platform Admin)
      dispute.resolutionLevel = 'PLATFORM_ADMIN';
      dispute.status = 'ESCALATED_TO_PLATFORM';
    }

    await dispute.save();
    res.status(200).json({ success: true, message: `Dispute escalated to ${dispute.resolutionLevel}` });
  } catch (error) { next(error); }
};