import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Custom Dark-themed DateTime Picker
 * Drop-in replacement for <input type="datetime-local">
 */
const CustomDateTimePicker = ({
  value,
  onChange,
  label,
  className = "",
  align = "right"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse YYYY-MM-DDTHH:mm
  const parsedDate = value ? new Date(value) : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const [viewYear, setViewYear] = useState(validDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(validDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(validDate.getDate());
  const [selectedHour, setSelectedHour] = useState(String(validDate.getHours()).padStart(2, '0'));
  const [selectedMinute, setSelectedMinute] = useState(String(validDate.getMinutes()).padStart(2, '0'));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const emitChange = (y, m, d, hh, mm) => {
    const yStr = String(y);
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateFormatted = `${yStr}-${mStr}-${dStr}T${hh}:${mm}`;
    onChange(dateFormatted);
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleDayClick = (d) => {
    setSelectedDay(d);
    emitChange(viewYear, viewMonth, d, selectedHour, selectedMinute);
  };

  const handleHourChange = (newH) => {
    setSelectedHour(newH);
    emitChange(viewYear, viewMonth, selectedDay, newH, selectedMinute);
  };

  const handleMinuteChange = (newM) => {
    setSelectedMinute(newM);
    emitChange(viewYear, viewMonth, selectedDay, selectedHour, newM);
  };

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ day: '', currentMonth: false });
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const isSelected = selectedDay === d && validDate.getMonth() === viewMonth && validDate.getFullYear() === viewYear;
    days.push({ day: d, currentMonth: true, isSelected });
  }

  const formattedDisplay = `${validDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${selectedHour}:${selectedMinute}`;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#141414] hover:bg-[#202020] border border-primary/60 text-white text-[10px] font-mono font-bold rounded-lg py-1.5 px-2.5 flex items-center gap-1.5 transition cursor-pointer"
      >
        <Clock size={12} className="text-primary" />
        <span>{formattedDisplay}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-[#181818] border border-[#2e2e2e] rounded-2xl p-4 shadow-2xl w-[280px] sm:w-[300px] text-white ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#262626]">
            <span className="text-xs font-black text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-[#282828] text-gray-400 hover:text-white rounded">
                <ChevronLeft size={14} />
              </button>
              <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-[#282828] text-gray-400 hover:text-white rounded">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((name, i) => (
              <span key={i} className="text-[9px] font-black uppercase text-gray-400">
                {name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-3">
            {days.map((item, idx) => (
              <button
                type="button"
                key={idx}
                disabled={!item.currentMonth}
                onClick={() => item.currentMonth && handleDayClick(item.day)}
                className={`h-7 rounded text-[11px] font-mono transition ${
                  item.isSelected
                    ? 'bg-primary text-white font-black'
                    : item.currentMonth
                    ? 'hover:bg-[#282828] text-gray-200'
                    : 'opacity-0 cursor-default'
                }`}
              >
                {item.day}
              </button>
            ))}
          </div>

          {/* Time Selector */}
          <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-xs">
            <span className="text-[10px] font-black uppercase text-gray-400">Time (HH:MM):</span>
            <div className="flex items-center gap-1 font-mono">
              <select
                value={selectedHour}
                onChange={(e) => handleHourChange(e.target.value)}
                className="bg-[#222222] border border-[#333333] text-white text-xs rounded px-1.5 py-1 outline-none"
              >
                {Array.from({ length: 24 }).map((_, h) => {
                  const val = String(h).padStart(2, '0');
                  return <option key={val} value={val}>{val}</option>;
                })}
              </select>
              <span>:</span>
              <select
                value={selectedMinute}
                onChange={(e) => handleMinuteChange(e.target.value)}
                className="bg-[#222222] border border-[#333333] text-white text-xs rounded px-1.5 py-1 outline-none"
              >
                {['00', '15', '30', '45', '59'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-3 btn-netflix py-1.5 rounded-lg text-[10px] font-black uppercase"
          >
            Set Time & Date
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomDateTimePicker;

