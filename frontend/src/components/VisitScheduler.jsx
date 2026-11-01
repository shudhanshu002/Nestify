import { useState } from 'react';
import API from '../api/client';
import { Calendar, Clock, Send, CheckCircle2 } from 'lucide-react';
import CustomDatePicker from './common/CustomDatePicker';

const VisitScheduler = ({ propertyId }) => {
  const [scheduled, setScheduled] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSchedule = async () => {
    if (!date) return alert("Please select a date for your visit");
    try {
      await API.post('/properties/visit-request', { propertyId, preferredDate: date });
      setScheduled(true);
    } catch (err) {
      alert("Failed to schedule visit");
    }
  };

  if (scheduled) return (
    <div className="bg-emerald-950/40 p-4 rounded-2xl flex items-center gap-3 border border-emerald-800/40 text-emerald-400">
      <CheckCircle2 size={18} />
      <p className="text-xs font-bold text-emerald-300">Visit requested! The owner will call you shortly.</p>
    </div>
  );

  return (
    <div className="bg-[#181818] p-5 rounded-2xl border border-[#2a2a2a] space-y-3 text-white">
      <h3 className="font-bold text-xs uppercase tracking-wider text-gray-200 flex items-center gap-2">
        <Calendar size={15} className="text-primary" /> Schedule a Physical Visit
      </h3>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <CustomDatePicker 
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={setDate}
            placeholder="Select Visit Date"
          />
        </div>
        <button 
          onClick={handleSchedule}
          className="btn-netflix p-2.5 rounded-xl text-white shadow-md cursor-pointer transition active:scale-95 shrink-0"
          title="Send Visit Request"
        >
          <Send size={15} />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 font-medium tracking-wider">
        Free service • Zero commitment • No charges
      </p>
    </div>
  );
};

export default VisitScheduler;
