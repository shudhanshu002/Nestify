import { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, AlertCircle, CheckCircle, 
  CreditCard, Loader2, Sparkles, Bed, ArrowRight 
} from 'lucide-react';
import API from '../../api/client';

const ExtendStayModal = ({ booking, onClose, onSuccess }) => {
  const currentCheckOut = new Date(booking.checkOutDate);
  const minDate = new Date(currentCheckOut.getTime() + 86400000); // at least +1 day
  const minDateStr = minDate.toISOString().split('T')[0];

  const defaultExtended = new Date(currentCheckOut.getTime() + 30 * 86400000); // +30 days default
  const [selectedDate, setSelectedDate] = useState(defaultExtended.toISOString().split('T')[0]);

  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Check inventory availability and calculate extension cost
  useEffect(() => {
    if (!selectedDate) return;

    const checkAvailability = async () => {
      setChecking(true);
      setErrorMsg('');
      try {
        const { data } = await API.get(`/bookings/${booking._id}/check-extend`, {
          params: { newCheckOutDate: selectedDate }
        });
        const result = data?.data || data;
        setAvailabilityData(result);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Failed to verify room inventory for requested dates.");
        setAvailabilityData(null);
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(checkAvailability, 250);
    return () => clearTimeout(timer);
  }, [selectedDate, booking._id]);

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
      const result = data?.data || data;
      alert(`🎉 Extension Confirmed!\nYour stay has been extended until ${new Date(selectedDate).toLocaleDateString()}.\nPayment of ₹${availabilityData.additionalAmount.toLocaleString()} recorded.`);
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to extend stay.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181818] text-white w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-[#2e2e2e] space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start pb-3 border-b border-[#282828]">
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-primary tracking-widest mb-1">
              <Sparkles size={12} className="text-amber-400" /> Active Residency Extension
            </div>
            <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">
              Extend Your Rent.
            </h3>
            <p className="text-xs font-bold text-gray-400 mt-0.5 truncate max-w-sm">
              {booking.property?.title} • {booking.room?.roomType}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-[#242424] hover:bg-[#333] text-gray-300 hover:text-white transition cursor-pointer"
            aria-label="Close extension modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* CURRENT STAY SUMMARY */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#222222] rounded-2xl border border-[#303030] text-xs">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Scheduled Check-in</span>
            <p className="font-black text-gray-200 mt-0.5">{new Date(booking.checkInDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-primary block tracking-wider">Current Check-out</span>
            <p className="font-black text-primary mt-0.5">{currentCheckOut.toLocaleDateString()}</p>
          </div>
        </div>

        {/* EXTENSION OPTIONS */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
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
                  className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                    isSelected 
                      ? 'btn-netflix shadow-md text-white' 
                      : 'bg-[#222222] text-gray-300 border border-[#303030] hover:bg-[#2c2c2c] hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Input */}
          <div className="p-3.5 bg-[#222222] rounded-2xl border border-[#303030] space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
              Or Select Exact New Check-Out Date
            </label>
            <input 
              type="date"
              min={minDateStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent font-bold text-sm text-white outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* AVAILABILITY & CONFLICT STATUS BOX */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a] transition-all">
          {checking ? (
            <div className="flex items-center gap-3 py-3 justify-center text-primary">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest">Checking Room Inventory...</span>
            </div>
          ) : errorMsg ? (
            <div className="flex items-start gap-3 text-primary bg-primary/10 p-3.5 rounded-xl border border-primary/20">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-xs uppercase tracking-wider">Extension Notice</p>
                <p className="text-xs mt-0.5 font-medium">{errorMsg}</p>
              </div>
            </div>
          ) : availabilityData?.available ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#282828]">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800/40">
                  <CheckCircle size={13} className="text-emerald-400" />
                  Available ({availabilityData.availableUnits} of {availabilityData.totalInventory} units free)
                </span>
                <span className="text-xs font-bold text-gray-400">
                  +{availabilityData.additionalDays} Days
                </span>
              </div>

              {/* Cost Calculation Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-400 font-bold">
                  <span>Additional Stay Duration</span>
                  <span className="font-mono text-white">{availabilityData.additionalDays} Days</span>
                </div>
                <div className="flex justify-between text-gray-400 font-bold">
                  <span>Room Tariff Rate</span>
                  <span className="font-mono text-white">₹{availabilityData.dailyRate?.toLocaleString()} / day</span>
                </div>
                <div className="flex justify-between text-gray-400 font-bold">
                  <span>New Scheduled Check-out</span>
                  <span className="font-mono text-emerald-400 font-black">
                    {new Date(availabilityData.newCheckOutDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-[#282828]">
                  <span className="font-black text-xs text-white uppercase">Extension Rent Due</span>
                  <span className="text-2xl font-black text-primary font-mono">
                    ₹{availabilityData.additionalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-primary bg-primary/10 p-3.5 rounded-xl border border-primary/20">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
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
          className="w-full btn-netflix py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Processing Extension & Payment...</span>
            </>
          ) : !availabilityData?.available ? (
            <span>Unavailable for Selected Window</span>
          ) : (
            <>
              <CreditCard size={15} />
              <span>Confirm & Pay Extension (₹{availabilityData?.additionalAmount?.toLocaleString()})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExtendStayModal;