import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { ShieldCheck, Calendar, Clock, CreditCard, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await API.get(`/bookings/${bookingId}`);
        setBooking(data.data);
      } catch (err) {
        console.error("Booking session expired");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, navigate]);

  const handleFinalize = async () => {
    if (!acceptedRules) return alert("Please accept the House Rules to proceed.");
    
    setIsFinalizing(true);
    try {
      // Calls Backend: router.post('/:bookingId/confirm', protect, confirmBooking)
      await API.post(`/bookings/${bookingId}/confirm`);
      navigate('/my-bookings', { state: { success: true } });
    } catch (err) {
      alert(err.response?.data?.message || "Transaction failed. Please try again.");
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  const serviceFee = booking.totalPrice * 0.05; // 5% platform fee
  const finalTotal = booking.totalPrice + serviceFee;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Confirm Your Stay</h1>
          <p className="text-gray-500 mt-1">Review details and complete your booking</p>
        </div>
        <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-orange-100">
          <Clock size={18} />
          <span className="text-sm font-bold">Expires in 10:00</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-primary" size={20} /> Booking Summary
            </h3>
            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
              <img 
                src={booking.property?.images?.[0]?.url || 'https://via.placeholder.com/150'} 
                className="w-24 h-24 object-cover rounded-lg" 
                alt="Property" 
              />
              <div>
                <h4 className="font-bold text-gray-900">{booking.property?.title}</h4>
                <p className="text-sm text-gray-500">{booking.room?.roomType} Unit</p>
                <div className="flex items-center gap-4 mt-2 text-xs font-medium text-gray-600">
                  <span className="flex items-center gap-1"><Calendar size={12}/> 1 Month Min.</span>
                  <span className="flex items-center gap-1"><ShieldCheck size={12}/> Secured</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-4">House Rules & Agreement</h3>
            <div className="space-y-3 max-h-40 overflow-y-auto p-4 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-100">
              <p>1. No noise after 10:00 PM.</p>
              <p>2. Visitors allowed only in common areas.</p>
              <p>3. Maintain cleanliness in shared spaces.</p>
              <p>4. 30-day notice period required before move-out.</p>
            </div>
            <label className="flex items-center gap-3 mt-6 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                onChange={(e) => setAcceptedRules(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition">
                I agree to the House Rules and Tenant Agreement.
              </span>
            </label>
          </div>
        </div>

        {/* Right: Payment Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg sticky top-8">
            <h3 className="font-bold text-lg mb-6">Price Breakdown</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Monthly Rent</span>
                <span>₹{booking.totalPrice}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Service Fee (5%)</span>
                <span>₹{serviceFee}</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-black text-xl text-gray-900">
                <span>Total</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>

            <button
              onClick={handleFinalize}
              disabled={isFinalizing || !acceptedRules}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg ${
                acceptedRules 
                ? 'bg-primary text-white hover:bg-blue-700 shadow-blue-200' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isFinalizing ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
              Confirm & Pay
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-4 uppercase font-bold tracking-widest">
              Secure SSL Encryption Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;