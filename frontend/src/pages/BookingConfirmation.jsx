import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  ShieldCheck, Calendar, Loader2, CheckCircle, Home, ArrowLeft, 
  AlertTriangle, RefreshCw, BookmarkCheck, ExternalLink, Sparkles 
} from 'lucide-react';
import API from '../api/client';
import { useState, useRef } from 'react';
import { toast } from '../context/ToastContext';

const BookingConfirmation = () => {
  const { propertyId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [conflictData, setConflictData] = useState(null);

  // Generate persistent idempotency key per checkout session
  const idempotencyKeyRef = useRef(
    `book_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  // Safety check for direct URL access without state
  if (!state || !state.room) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-netflixRed shadow-2xl">
          <Calendar size={28} />
        </div>
        <p className="font-black text-gray-400 uppercase tracking-widest text-sm">Session Expired or Missing Details</p>
        <button 
          onClick={() => navigate(propertyId ? `/property/${propertyId}` : '/')} 
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3.5 rounded-2xl font-bold transition border border-neutral-700 shadow-xl flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Return to Property
        </button>
      </div>
    );
  }

  const { property, room, checkIn, checkOut, days } = state;
  const grandTotal = (room.basePrice * days) + 149;

  const handleFinalizeBooking = async () => {
    if (isProcessing) return; // Prevent double clicks
    setIsProcessing(true);
    setConflictData(null);

    try {
      // POST booking with atomic concurrency protection & idempotency header
      await API.post('/bookings', {
        property: property._id,
        room: room._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalAmount: grandTotal,
        idempotencyKey: idempotencyKeyRef.current
      }, {
        headers: {
          'Idempotency-Key': idempotencyKeyRef.current
        }
      });
      
      toast.success('🎉 Booking confirmed! Welcome to your new home.');
      navigate('/booking/success');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      const msg = data?.message || "Booking request failed.";

      if (status === 409) {
        // High-level Conflict Handling (Dual booking or Overbooking)
        setConflictData({
          code: data?.code || 'CONFLICT',
          message: msg,
          conflict: data?.conflict || null
        });
        toast.warning(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition"
      >
        <ArrowLeft size={16} /> Back to details
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-12">
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-netflixRed tracking-widest">
              <Sparkles size={12} /> Step 2 of 2 • Secure Checkout
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white">Review Stay.</h1>
          </div>

          {/* CONFLICT MANAGEMENT BANNER */}
          {conflictData && (
            <div className="p-6 rounded-3xl bg-neutral-900/90 border border-amber-500/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={24} />
                <div className="space-y-1">
                  <h4 className="font-black text-amber-300 text-base">
                    {conflictData.code === 'DUAL_BOOKING_CONFLICT' ? 'Dual Booking Detected' : 'Booking Conflict Detected'}
                  </h4>
                  <p className="text-xs text-gray-300 font-medium leading-relaxed">
                    {conflictData.message}
                  </p>
                </div>
              </div>

              {conflictData.code === 'DUAL_BOOKING_CONFLICT' ? (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    onClick={() => navigate('/my-bookings')}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition shadow flex items-center gap-2"
                  >
                    <BookmarkCheck size={14} /> View My Active Bookings
                  </button>
                  <button 
                    onClick={() => navigate(`/property/${property._id}`)}
                    className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition border border-neutral-700 flex items-center gap-2"
                  >
                    <RefreshCw size={14} /> Choose Different Dates
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    onClick={() => navigate(`/property/${property._id}`)}
                    className="px-5 py-2.5 rounded-xl bg-netflixRed hover:bg-netflixHover text-white font-black text-xs transition shadow flex items-center gap-2"
                  >
                    <RefreshCw size={14} /> View Available Rooms
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAY DETAILS CARD */}
          <div className="bg-[#181818] p-8 rounded-[3rem] border border-[#292929] shadow-2xl flex flex-col sm:flex-row gap-6">
            <img 
              src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80'} 
              alt={property.title}
              className="w-full sm:w-40 h-40 rounded-[2rem] object-cover border border-neutral-800 shadow" 
            />
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-netflixRed px-2 py-0.5 rounded bg-netflixRed/10 border border-netflixRed/20">
                {room.roomType || 'STANDARD'} ROOM
              </span>
              <h3 className="text-2xl font-black text-white">{property.title}</h3>
              <p className="text-gray-400 font-bold text-xs">
                {new Date(checkIn).toLocaleDateString()} — {new Date(checkOut).toLocaleDateString()} ({days} {days === 1 ? 'Night' : 'Nights'})
              </p>
              
              <div className="mt-4 p-4 bg-neutral-900/80 rounded-2xl border border-neutral-800 flex gap-3 items-center">
                 <ShieldCheck className="text-emerald-400 shrink-0" size={20}/>
                 <p className="text-[11px] text-gray-400 font-medium leading-tight">
                   Protected by Nestify Concurrency Guard & Move-in Guarantee.
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* BILLING SIDEBAR */}
        <div className="bg-[#181818] p-8 sm:p-10 rounded-[3.5rem] border border-[#292929] shadow-2xl space-y-6 h-fit">
          <h4 className="font-black text-xl text-white">Billing Breakdown</h4>
          
          <div className="space-y-3.5 border-b border-neutral-800 pb-6 text-sm">
             <div className="flex justify-between text-gray-400 font-medium">
               <span>Base Rent ({days} × ₹{room.basePrice})</span>
               <span className="text-white font-bold">₹{room.basePrice * days}</span>
             </div>
             <div className="flex justify-between text-gray-400 font-medium">
               <span>Platform Service Fee</span>
               <span className="text-white font-bold">₹149</span>
             </div>
             <div className="flex justify-between text-gray-400 font-medium">
               <span>Occupancy Assurance</span>
               <span className="text-emerald-400 font-bold">FREE</span>
             </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-gray-400 font-black uppercase text-xs tracking-widest">Grand Total</span>
            <span className="text-4xl font-black text-netflixRed tracking-tighter italic">₹{grandTotal}</span>
          </div>

          <button 
            disabled={isProcessing}
            onClick={handleFinalizeBooking}
            className={`w-full py-5 rounded-[2rem] font-black text-lg transition shadow-2xl flex items-center justify-center gap-3 active:scale-95 cursor-pointer ${
              isProcessing 
                ? 'bg-neutral-800 text-gray-400 cursor-not-allowed' 
                : 'bg-netflixRed hover:bg-netflixHover text-white'
            }`}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={22} /> : <CheckCircle size={22} />}
            {isProcessing ? 'Verifying Availability...' : 'Pay & Confirm'}
          </button>

          <p className="text-[10px] text-center text-gray-500 font-semibold uppercase tracking-wider">
            Zero Double-Booking Guarantee • Instant Refund on Overlap
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
