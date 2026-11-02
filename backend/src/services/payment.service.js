import Payment from "../models/payment.model.js";
import Company from "../models/company.model.js";
import User from "../models/user.model.js";

/*
 calculates the split between platform and owner based on Commercial Agreement Deal
*/

export const calculateCommission = async (totalAmount, companyId, ownerId) => {
    let commissionRate = 0.06; // default: 6%

    if (ownerId) {
        const owner = await User.findById(ownerId);
        if (owner && owner.deal && owner.deal.status === 'ACTIVE') {
            if (owner.deal.dealType === 'ANNUAL_TOKEN') {
                commissionRate = 0; // 0% commission on bookings for Annual Token holders
            } else if (owner.deal.dealType === 'COMMISSION_PERCENTAGE') {
                commissionRate = (owner.deal.commissionRate || 6) / 100;
            }
        }
    } else if (companyId) {
        const company = await Company.findById(companyId);
        if (company && company.commissionPolicy?.type === 'PERCENTAGE') {
            commissionRate = company.commissionPolicy.value / 100;
        }
    }

    const platformFee = Math.round(totalAmount * commissionRate);
    const ownerSettlementAmount = totalAmount - platformFee;

    return { platformFee, ownerSettlementAmount };
};

/*
 * Processes a successful transaction and records it in the ledger
*/
export const processPaymentRecord = async (paymentData) => {
  const { bookingId, transactionId, gateway, totalAmount, companyId, ownerId } = paymentData;

  const { platformFee, ownerSettlementAmount } = await calculateCommission(totalAmount, companyId, ownerId);

  const payment = await Payment.create({
    booking: bookingId,
    transactionId,
    gateway,
    amount: totalAmount,
    platformFee,
    ownerSettlementAmount,
    status: 'COMPLETED'
  });

  return payment;
};
