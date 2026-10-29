import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, Calendar, Loader2, CheckCircle, Home, ArrowLeft } from 'lucide-react';
import API from '../api/client';
import { useState } from 'react';

const BookingConfirmation = () => {
  const { propertyId } = useParams(); // 󾠮 Matches the :propertyId in App.jsx
  const { state } = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // 󾠯 Safety check for direct URL access
  if (!state || !state.room) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <p className="font-black text-gray-400 uppercase tracking-widest">Session Expired</p>
        <button onClick={() => navigate(`/property/${propertyId}`)} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold">
          Return to Property
        </button>
      </div>
    );
  }

  const { property, room, checkIn, checkOut, days } = state;
  const grandTotal = (room.basePrice * days) + 149;

  const handleFinalizeBooking = async () => {
    setIsProcessing(true);
    try {
      // Final POST to create the legit booking
      await API.post('/bookings', {
        property: property._id,
        room: room._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalAmount: grandTotal
      });
      
      navigate('/booking/success'); // Moves to the success page in your App.jsx
    } catch (err) {
      alert(err.response?.data?.message || "Booking failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-12">
        <div className="space-y-6">
          <h1 className="text-4xl font-black italic tracking-tighter">Review Stay.</h1>
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl flex gap-6">
            <img src={property.images?.[0]?.url} className="w-40 h-40 rounded-[2rem] object-cover" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">{property.title}</h3>
              <p className="text-gray-400 font-bold">{room.roomType} • {days} Days</p>
              <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                 <ShieldCheck className="text-primary" size={20}/>
                 <p className="text-[10px] text-gray-500 font-bold leading-tight">Your payment is protected by our Move-in Guarantee.</p>
              </div>
            </div>
          </div>
        </div>

        {/* BILLING SIDEBAR */}
        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-50 shadow-2xl space-y-8">
          <h4 className="font-black text-xl">Final Billing</h4>
          <div className="space-y-4 border-b pb-8">
             <div className="flex justify-between text-gray-500 font-bold"><span>Stay Cost</span><span>₹{room.basePrice * days}</span></div>
             <div className="flex justify-between text-gray-500 font-bold"><span>Service Fee</span><span>₹149</span></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-black uppercase text-xs tracking-widest">Grand Total</span>
            <span className="text-4xl font-black text-primary tracking-tighter italic">₹{grandTotal}</span>
          </div>

          <button 
            disabled={isProcessing}
            onClick={handleFinalizeBooking}
            className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-primary transition shadow-2xl flex items-center justify-center gap-3 active:scale-95"
          >
            {isProcessing ? <Loader2 className="animate-spin"/> : <CheckCircle />}
            {isProcessing ? 'Verifying...' : 'Pay & Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;