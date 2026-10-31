import { useState, useEffect } from 'react';
import { 
  X, Printer, CheckCircle2, ShieldCheck, Download, 
  Copy, Check, Building, Calendar, User, Phone, Mail, 
  MapPin, Hash, CreditCard, Sparkles, FileText
} from 'lucide-react';
import API from '../../api/client';

const ReceiptModal = ({ booking, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!booking) return;

    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/bookings/${booking._id}/receipt`);
        if (data.success && data.data) {
          setReceiptDetails(data.data);
        }
      } catch (err) {
        // Fallback to client-side computation from booking prop
        console.warn("Could not load backend receipt data, using booking prop fallback", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [booking]);

  if (!booking) return null;

  // Compute values if backend response is pending or fallback
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const diffDays = Math.max(1, Math.ceil(Math.abs(checkOut - checkIn) / (1000 * 60 * 60 * 24)));
  
  const totalAmount = booking.totalAmount || 0;
  const baseTariff = receiptDetails?.pricing?.baseTariff || Math.round((totalAmount * 0.88) * 100) / 100;
  const totalTax = receiptDetails?.pricing?.taxesAndFees || Math.round((totalAmount - baseTariff) * 100) / 100;
  const cgst = receiptDetails?.pricing?.cgst || Math.round((totalTax / 2) * 100) / 100;
  const sgst = receiptDetails?.pricing?.sgst || Math.round((totalTax - cgst) * 100) / 100;
  const dailyRate = Math.round(baseTariff / diffDays);

  const receiptNumber = receiptDetails?.receiptNumber || `RCP-${booking._id.slice(-8).toUpperCase()}`;
  const transactionId = receiptDetails?.transactionId || `TXN-${booking._id.slice(-6).toUpperCase()}-${new Date(booking.createdAt || Date.now()).getTime().toString().slice(-6)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(receiptNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const property = booking.property || {};
  const owner = property.owner || {};
  const tenant = booking.tenant || {};
  const room = booking.room || {};

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[120] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      {/* Inline styles for Clean Print Engine */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-receipt, #official-receipt * {
            visibility: visible !important;
          }
          #official-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 30px !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            background: white !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-3xl my-auto animate-in zoom-in-95 duration-200">
        
        {/* MODAL ACTION BAR (Hidden when printing) */}
        <div className="no-print flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <FileText size={16} className="text-primary"/> Official Tax Invoice
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-gray-100 text-gray-900 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <Printer size={16} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition active:scale-95"
              title="Close Receipt"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div 
          id="official-receipt" 
          className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-gray-100 text-gray-900 relative overflow-hidden font-sans"
        >
          {/* Subtle watermarked seal in background */}
          <div className="absolute right-10 top-28 opacity-[0.03] select-none pointer-events-none rotate-12">
            <ShieldCheck size={360} />
          </div>

          {/* 1. HEADER SECTION */}
          <div className="border-b border-gray-200 pb-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black tracking-tighter text-primary">PG.FINDER</span>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-widest">Verified</span>
                </div>
                <p className="text-xs text-gray-400 font-medium mt-1">Nestify Living & Housing Platform Pvt. Ltd.</p>
                <p className="text-[11px] text-gray-400">GSTIN: 07AABCN8934L1Z1 • Support: care@pgfinder.com</p>
              </div>

              <div className="text-left md:text-right">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Accommodation Receipt & Tax Invoice</span>
                <div className="flex items-center md:justify-end gap-2 mt-1">
                  <h2 className="text-xl font-black font-mono tracking-tight text-gray-900">{receiptNumber}</h2>
                  <button 
                    onClick={handleCopyId} 
                    className="no-print text-gray-400 hover:text-primary transition" 
                    title="Copy Receipt Number"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 font-bold mt-1">
                  Date: {new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mt-2 border border-green-200">
                  <CheckCircle2 size={13} className="text-green-600" /> Payment Status: Paid
                </div>
              </div>
            </div>
          </div>

          {/* 2. BILLED TO & PROPERTY DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-gray-50/70 p-6 rounded-3xl border border-gray-100">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <User size={12} className="text-primary"/> Resident / Billed To
              </p>
              <h3 className="text-lg font-black text-gray-900">
                {tenant.firstName ? `${tenant.firstName} ${tenant.lastName || ''}` : 'Resident Guest'}
              </h3>
              <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mt-1">
                <Mail size={12} className="text-gray-400"/> {tenant.email || 'N/A'}
              </p>
              {tenant.phone && (
                <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Phone size={12} className="text-gray-400"/> {tenant.phone}
                </p>
              )}
              <p className="text-[10px] font-mono text-gray-400 mt-2">Resident ID: {tenant._id || booking.tenant || 'GUEST-ID'}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <Building size={12} className="text-primary"/> Property & Host Details
              </p>
              <h3 className="text-lg font-black text-gray-900">{property.title || 'Residency Accommodation'}</h3>
              <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-gray-400 shrink-0"/> 
                <span>{property.location?.address ? `${property.location.address}, ` : ''}{property.location?.city || 'City'}, {property.location?.state || 'State'}</span>
              </p>
              <p className="text-xs font-semibold text-gray-600 mt-1">
                Host: <span className="font-bold">{owner.firstName ? `${owner.firstName} ${owner.lastName || ''}` : 'Verified Partner'}</span>
              </p>
              <p className="text-[10px] font-black text-primary uppercase mt-1">Category: {property.category || 'PG / Hostel'}</p>
            </div>
          </div>

          {/* 3. STAY DURATION SNAPSHOT */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl border border-gray-100 bg-white mb-8 shadow-sm">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Check-in</span>
              <p className="text-sm font-black text-gray-900 mt-0.5">
                {checkIn.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Check-out</span>
              <p className="text-sm font-black text-gray-900 mt-0.5">
                {checkOut.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Unit Type</span>
              <p className="text-sm font-black text-gray-900 mt-0.5">
                {room.roomType || 'Standard'} {room.roomNumber ? `• R-${room.roomNumber}` : ''}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Duration</span>
              <p className="text-sm font-black text-primary mt-0.5">
                {diffDays} {diffDays === 1 ? 'Night' : 'Nights'} Stay
              </p>
            </div>
          </div>

          {/* 4. ITEMIZED FINANCIAL SCHEDULE */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 text-center">HSN/SAC</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Daily Rate</th>
                  <th className="py-3 px-2 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium">
                <tr>
                  <td className="py-4 px-2">
                    <p className="font-bold text-gray-900">Room Stay & Accommodation Tariff</p>
                    <p className="text-[10px] text-gray-400">Clean, furnished {room.roomType || 'Unit'} living</p>
                  </td>
                  <td className="py-4 px-2 text-center text-gray-500 font-mono">996311</td>
                  <td className="py-4 px-2 text-center font-bold text-gray-700">{diffDays} Days</td>
                  <td className="py-4 px-2 text-right text-gray-700 font-mono">₹{dailyRate.toLocaleString()}</td>
                  <td className="py-4 px-2 text-right font-black text-gray-900 font-mono">₹{baseTariff.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-4 px-2">
                    <p className="font-bold text-gray-900">Platform Services & Maintenance Infrastructure</p>
                    <p className="text-[10px] text-gray-400">24/7 digital issue tracking and support</p>
                  </td>
                  <td className="py-4 px-2 text-center text-gray-500 font-mono">998599</td>
                  <td className="py-4 px-2 text-center font-bold text-gray-700">1 Stay</td>
                  <td className="py-4 px-2 text-right text-gray-500 font-mono">Included</td>
                  <td className="py-4 px-2 text-right font-black text-gray-900 font-mono">₹0.00</td>
                </tr>
                <tr>
                  <td className="py-4 px-2">
                    <p className="font-bold text-gray-900">PG.FINDER Move-In Guarantee Protection</p>
                    <p className="text-[10px] text-gray-400">Escrow verification and tenant protection cover</p>
                  </td>
                  <td className="py-4 px-2 text-center text-gray-500 font-mono">997133</td>
                  <td className="py-4 px-2 text-center font-bold text-gray-700">1 Stay</td>
                  <td className="py-4 px-2 text-right text-gray-500 font-mono">Included</td>
                  <td className="py-4 px-2 text-right font-black text-gray-900 font-mono">₹0.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. TOTALS AND TAX SUMMARY */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-t border-gray-200 pt-6 mb-8">
            <div className="space-y-2 max-w-sm">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
                <CreditCard size={14} className="text-primary"/> Payment Method: Prepaid Online Gateway
              </div>
              <p className="text-[10px] font-mono text-gray-400 break-all">
                Ref ID: {transactionId}
              </p>
              <div className="flex items-center gap-2 mt-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <ShieldCheck size={16} className="text-primary shrink-0"/>
                <p className="text-[10px] font-bold text-gray-600">
                  Protected by 100% Verified Resident Guarantee.
                </p>
              </div>
            </div>

            <div className="w-full md:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Taxable Value:</span>
                <span className="font-mono">₹{baseTariff.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>CGST (6%):</span>
                <span className="font-mono">₹{cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>SGST (6%):</span>
                <span className="font-mono">₹{sgst.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-black text-gray-900">
                <span>Total Amount Paid:</span>
                <span className="text-primary font-mono text-lg">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-green-600">
                <span>Balance Due:</span>
                <span className="font-mono">₹0.00 (NIL)</span>
              </div>
            </div>
          </div>

          {/* 6. LEGAL NOTICE & DIGITAL SIGNATURE */}
          <div className="border-t border-gray-100 pt-6 text-[10px] text-gray-400 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center md:text-left leading-relaxed">
              This is an electronically generated Tax Invoice and Accommodation Voucher.<br/>
              Valid across all properties in the PG Finder network. No physical signature required.
            </p>
            <div className="text-center md:text-right shrink-0">
              <div className="inline-block border-2 border-dashed border-gray-200 rounded-xl px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-gray-500 bg-gray-50">
                [ Digitally Certified ]
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ReceiptModal;
