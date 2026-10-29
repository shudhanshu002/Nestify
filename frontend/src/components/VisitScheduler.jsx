import { useState } from 'react';
import API from '../api/client';
import { Calendar, Clock, Send, CheckCircle2 } from 'lucide-react';

const VisitScheduler = ({ propertyId }) => {
  const [scheduled, setScheduled] = useState(false);
  const [date, setDate] = useState('');

  const handleSchedule = async () => {
    try {
      await API.post('/properties/visit-request', { propertyId, preferredDate: date });
      setScheduled(true);
    } catch (err) {
      alert("Failed to schedule visit");
    }
  };

  if (scheduled) return (
    <div className="bg-green-50 p-4 rounded-2xl flex items-center gap-3 border border-green-100">
      <CheckCircle2 className="text-secondary" />
      <p className="text-sm font-bold text-green-700">Visit requested! The owner will call you.</p>
    </div>
  );

  return (
    <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <Calendar size={18} className="text-primary" /> Schedule a Visit
      </h3>
      <div className="flex gap-2">
        <input 
          type="date" 
          className="flex-1 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary text-sm"
          onChange={(e) => setDate(e.target.value)}
        />
        <button 
          onClick={handleSchedule}
          className="bg-white text-gray-900 p-3 rounded-xl border border-gray-200 hover:bg-primary hover:text-white transition"
        >
          <Send size={18} />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 font-medium px-1 uppercase tracking-widest">
        Free service • No visit charges
      </p>
    </div>
  );
};

export default VisitScheduler;