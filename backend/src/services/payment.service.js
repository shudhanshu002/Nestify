import Payment from "../models/payment.model";
import Company from "../models/company.model";

/*
 calculates the split between platform and owner
*/

export const calculateCommission = async (totalAmount, companyId) => {
    let commissionRate = 0.10; // default: 10 %

    if(companyId) {
        const company = await Company.findById(companyId);
        if (company && company.commissionPolicy.type === 'PERCENTAGE') {
            commissionRate = company.commissionPolicy.value / 100;
        }
    }

    const platformFee = totalAmount * commissionRate;
    const ownerSettlementAmount = totalAmount - platformFee;

    return {platformFee, ownerSettlementAmount};
}

/*
 * Processes a successful transaction and records it in the ledger
*/
export const processPaymentRecord = async (paymentData) => {
  const { bookingId, transactionId, gateway, totalAmount, companyId } = paymentData;

  const { platformFee, ownerSettlementAmount } = await calculateCommission(totalAmount, companyId);

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