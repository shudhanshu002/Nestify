import { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle, AlertCircle, Loader2, X, 
  ArrowRight, ShieldCheck, Clock, CreditCard, ChevronRight, Sparkles 
} from 'lucide-react';
import API from '../../api/client';

const ExtendStayModal = ({ booking, onClose, onSuccess }) => {
  const currentCheckOut = new Date(booking.checkOutDate);
  
  // Default to +30 days (1 month) from current checkout
  const defaultNextDate = new Date(currentCheckOut.getTime() + 30 * 86400000);
  const minDateStr = new Date(currentCheckOut.getTime() + 86400000).toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(defaultNextDate.toISOString().split('T')[0]);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [checking, setChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check availability whenever selectedDate changes
  useEffect(() => {
    let isMounted = true;
    const checkAvailability = async () => {
      setChecking(true);
      setErrorMsg('');
      try {
        const { data } = await API.post(`/bookings/${booking._id}/check-extension`, {
          newCheckOutDate: selectedDate
        });
        if (isMounted) {
          setAvailabilityData(data);
        }
      } catch (err) {
        if (isMounted) {
          setAvailabilityData(null);
          setErrorMsg(err.response?.data?.message || "Failed to check room availability.");
        }
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    if (selectedDate) {
      checkAvailability();
    }

    return () => { isMounted = false; };
  }, [booking._id, selectedDate]);

  const handlePresetDays = (days) => {
    const next = new Date(currentCheckOut.getTime() + days * 86400000);
    setSelectedDate(next.toISOString().split('T')[0]);
  };

  const handleConfirmExtension = async () => {
    if (!availabilityData?.available) return;
    setSubmitting(true);
    try {
      const { data } = await API.post(`/bookings/${booking._id}/extend`, {
        newCheckOutDate: selectedDate
      });
      alert(`🎉 Extension Confirmed!\nYour stay has been extended until ${new Date(selectedDate).toLocaleDateString()}.\nPayment of ₹${availabilityData.additionalAmount.toLocaleString()} recorded.`);
      if (onSuccess) onSuccess(data.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to extend stay.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[3rem] p-6 sm:p-10 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-primary tracking-widest mb-1">
              <Sparkles size={12} className="text-amber-500" /> Active Residency Extension
            </div>
            <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-gray-900">
              Extend Your Rent.
            </h3>
            <p className="text-xs font-bold text-gray-400 mt-0.5 truncate max-w-sm">
              {booking.property?.title} • {booking.room?.roomType}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* CURRENT STAY SUMMARY */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Scheduled Check-in</span>
            <p className="font-black text-gray-800 mt-0.5">{new Date(booking.checkInDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-rose-500 block tracking-wider">Current Check-out</span>
            <p className="font-black text-rose-600 mt-0.5">{currentCheckOut.toLocaleDateString()}</p>
          </div>
        </div>

        {/* EXTENSION OPTIONS */}
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest block">
            Choose Extension Duration
          </label>
          
          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '+15 Days', days: 15 },
              { label: '+1 Month', days: 30 },
              { label: '+2 Months', days: 60 }
            ].map(preset => {
              const target = new Date(currentCheckOut.getTime() + preset.days * 86400000).toISOString().split('T')[0];
              const isSelected = selectedDate === target;
              return (
                <button
                  type="button"
                  key={preset.days}
                  onClick={() => handlePresetDays(preset.days)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider transition ${
                    isSelected 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Input */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              Or Select Exact New Check-Out Date
            </label>
            <input 
              type="date"
              min={minDateStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent font-bold text-sm text-gray-900 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* AVAILABILITY & CONFLICT STATUS BOX */}
        <div className="p-5 rounded-2xl border transition-all">
          {checking ? (
            <div className="flex items-center gap-3 py-3 justify-center text-primary">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest">Checking Room Inventory...</span>
            </div>
          ) : errorMsg ? (
            <div className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-xs uppercase tracking-wider">Extension Blocked</p>
                <p className="text-xs mt-0.5 font-medium">{errorMsg}</p>
              </div>
            </div>
          ) : availabilityData?.available ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <CheckCircle size={14} className="text-emerald-600" />
                  Available ({availabilityData.availableUnits} of {availabilityData.totalInventory} units free)
                </span>
                <span className="text-xs font-bold text-gray-400">
                  +{availabilityData.additionalDays} Days
                </span>
              </div>

              {/* Cost Calculation Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Additional Stay Duration</span>
                  <span className="font-mono text-gray-800">{availabilityData.additionalDays} Days</span>
                </div>
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Room Tariff Rate</span>
                  <span className="font-mono text-gray-800">₹{availabilityData.dailyRate.toLocaleString()} / day</span>
                </div>
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>New Scheduled Check-out</span>
                  <span className="font-mono text-emerald-600 font-black">{new Date(availabilityData.newCheckOutDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="font-black text-sm text-gray-900 uppercase">Extension Rent Due</span>
                  <span className="text-2xl font-black text-primary font-mono">
                    ₹{availabilityData.additionalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-xs uppercase tracking-wider">No Rooms Available</p>
                <p className="text-xs mt-0.5 font-medium">
                  All {availabilityData?.totalInventory || 'configured'} units of this room type are booked for those dates. Please select an earlier check-out date.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACTION BUTTON */}
        <button
          disabled={checking || submitting || !availabilityData?.available}
          onClick={handleConfirmExtension}
          className="w-full bg-primary hover:bg-rose-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none active:scale-95"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Processing Extension & Payment...</span>
            </>
          ) : !availabilityData?.available ? (
            <span>Sold Out for Selected Window</span>
          ) : (
            <>
              <CreditCard size={16} />
              <span>Confirm & Pay Extension (₹{availabilityData?.additionalAmount?.toLocaleString()})</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default ExtendStayModal;
