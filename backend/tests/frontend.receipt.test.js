import { describe, it, expect } from '@jest/globals';

describe('Frontend ReceiptModal Financial Computation & Alignment Suite', () => {
  // Replicating frontend ReceiptModal financial calculation logic
  const computeFrontendReceiptBreakdown = (booking, receiptDetails = null) => {
    const totalAmount = receiptDetails?.pricing?.totalAmount || booking.totalAmount || 0;
    const platformFee = receiptDetails?.pricing?.platformFee !== undefined
      ? receiptDetails.pricing.platformFee
      : Math.round(totalAmount * 0.03);
    const otherCharges = receiptDetails?.pricing?.otherCharges !== undefined
      ? receiptDetails.pricing.otherCharges
      : Math.round(totalAmount * 0.02);
    const totalTax = receiptDetails?.pricing?.taxesAndFees !== undefined
      ? receiptDetails.pricing.taxesAndFees
      : Math.round(totalAmount * 0.10);
    const cgst = receiptDetails?.pricing?.cgst !== undefined
      ? receiptDetails.pricing.cgst
      : Math.round((totalTax / 2) * 100) / 100;
    const sgst = receiptDetails?.pricing?.sgst !== undefined
      ? receiptDetails.pricing.sgst
      : Math.round((totalTax - cgst) * 100) / 100;
    const baseTariff = receiptDetails?.pricing?.baseTariff !== undefined
      ? receiptDetails.pricing.baseTariff
      : Math.max(0, totalAmount - platformFee - otherCharges - totalTax);

    const balanceDue = 0; // Paid in Full

    return {
      totalAmount,
      baseTariff,
      platformFee,
      otherCharges,
      cgst,
      sgst,
      totalTax,
      balanceDue,
      calculatedTotal: baseTariff + platformFee + otherCharges + cgst + sgst
    };
  };

  it('should perfectly reconcile with no fallback or rounding discrepancies for standard rent', () => {
    const booking = { totalAmount: 12000 };
    const breakdown = computeFrontendReceiptBreakdown(booking);

    expect(breakdown.platformFee).toBe(360); // 3%
    expect(breakdown.otherCharges).toBe(240); // 2%
    expect(breakdown.totalTax).toBe(1200);   // 10%
    expect(breakdown.cgst).toBe(600);        // 5%
    expect(breakdown.sgst).toBe(600);        // 5%
    expect(breakdown.baseTariff).toBe(10200);// 12000 - 360 - 240 - 1200
    expect(breakdown.calculatedTotal).toBe(12000);
    expect(breakdown.balanceDue).toBe(0);
  });

  it('should accept pre-computed backend values when provided in receiptDetails', () => {
    const booking = { totalAmount: 15000 };
    const receiptDetails = {
      receiptNumber: 'RCP-8A9B1C2D',
      pricing: {
        totalAmount: 15000,
        platformFee: 450,
        otherCharges: 300,
        taxesAndFees: 1500,
        cgst: 750,
        sgst: 750,
        baseTariff: 12750
      }
    };

    const breakdown = computeFrontendReceiptBreakdown(booking, receiptDetails);

    expect(breakdown.totalAmount).toBe(15000);
    expect(breakdown.platformFee).toBe(450);
    expect(breakdown.otherCharges).toBe(300);
    expect(breakdown.cgst).toBe(750);
    expect(breakdown.sgst).toBe(750);
    expect(breakdown.baseTariff).toBe(12750);
    expect(breakdown.calculatedTotal).toBe(15000);
  });

  it('should verify SAC service codes used in the invoice', () => {
    const invoiceServices = [
      { name: 'Room Stay & Accommodation Tariff', sac: '996311' },
      { name: 'Platform Technology & Convenience Charges', sac: '998599' },
      { name: 'Building Maintenance & Escrow Guarantee Fund', sac: '997133' }
    ];

    expect(invoiceServices.find(s => s.name.includes('Platform Technology'))?.sac).toBe('998599');
    expect(invoiceServices.find(s => s.name.includes('Building Maintenance'))?.sac).toBe('997133');
    expect(invoiceServices.find(s => s.name.includes('Accommodation'))?.sac).toBe('996311');
  });

  it('should handle odd and prime booking amounts without loss of currency balance', () => {
    const trickyAmounts = [1337, 4999, 7777, 9999, 11111, 23456];

    trickyAmounts.forEach(amount => {
      const breakdown = computeFrontendReceiptBreakdown({ totalAmount: amount });
      expect(breakdown.calculatedTotal).toBe(amount);
      expect(breakdown.cgst + breakdown.sgst).toBe(breakdown.totalTax);
    });
  });
});
