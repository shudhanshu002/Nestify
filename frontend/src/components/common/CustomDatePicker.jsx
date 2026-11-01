import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Custom Website-Themed Netflix Dark Calendar & Date Picker
 * Drop-in replacement for <input type="date">
 */
const CustomDatePicker = ({
  value,
  onChange,
  min,
  max,
  label,
  placeholder = "Select date",
  className = "",
  align = "left",
  disabled = false,
  showShortcuts = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current value or fallback to today
  const selectedDate = value ? new Date(value + (value.length === 10 ? 'T00:00:00' : '')) : null;
  const initialViewDate = selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();

  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keep view in sync when value changes
  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [value]);

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

  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isDateDisabled = (dateObj) => {
    const ymd = toYMD(dateObj);
    if (min && ymd < min) return true;
    if (max && ymd > max) return true;
    return false;
  };

  const handleSelectDay = (day) => {
    const picked = new Date(viewYear, viewMonth, day);
    if (isDateDisabled(picked)) return;
    const ymd = toYMD(picked);
    onChange(ymd);
    setIsOpen(false);
  };

  const handleShortcut = (daysFromToday) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const ymd = toYMD(d);
    onChange(ymd);
    setIsOpen(false);
  };

  // Build calendar matrix
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(viewYear, viewMonth, 0).getDate();

  const days = [];
  // Filler days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({ day: prevMonthTotalDays - i, currentMonth: false, disabled: true });
  }
  // Days of current month
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateObj = new Date(viewYear, viewMonth, d);
    const ymd = toYMD(dateObj);
    const isSelected = value === ymd;
    const isToday = toYMD(new Date()) === ymd;
    const isDisabled = isDateDisabled(dateObj);
    days.push({ day: d, currentMonth: true, isSelected, isToday, isDisabled, ymd });
  }

  // Format label for button
  const formattedDisplay = selectedDate && !isNaN(selectedDate.getTime())
    ? selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : placeholder;

  return (
    <div className={`relative inline-block w-full text-left ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1.5">
          <CalendarIcon size={12} className="text-primary" /> {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#202020] hover:bg-[#282828] border border-[#333333] hover:border-[#444444] text-white text-xs font-bold rounded-xl py-2.5 px-3.5 flex items-center justify-between gap-2 transition cursor-pointer shadow-sm ${
          isOpen ? 'border-primary ring-1 ring-primary/40' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="text-primary shrink-0" />
          <span className={value ? 'text-white font-mono' : 'text-gray-400'}>
            {formattedDisplay}
          </span>
        </span>
        <span className="text-[10px] text-gray-500 font-bold uppercase shrink-0">
          {isOpen ? 'Close' : 'Pick'}
        </span>
      </button>

      {/* Dropdown Calendar Popup (Website Dark Theme) */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-[#181818] border border-[#2e2e2e] rounded-2xl p-4 shadow-2xl shadow-black/90 w-[300px] sm:w-[320px] animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Calendar Header with Month/Year and Next/Prev Arrows */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#262626]">
            <span className="text-sm font-black text-white italic tracking-tight">
              {MONTH_NAMES[viewMonth]} <span className="text-primary font-mono not-italic">{viewYear}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-[#282828] text-gray-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-[#282828] text-gray-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Quick Shortcuts Bar */}
          {showShortcuts && (
            <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b border-[#262626]">
              <button
                type="button"
                onClick={() => handleShortcut(0)}
                className="px-2 py-1 rounded-md bg-[#222222] hover:bg-primary hover:text-white text-gray-300 text-[10px] font-bold uppercase transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleShortcut(1)}
                className="px-2 py-1 rounded-md bg-[#222222] hover:bg-primary hover:text-white text-gray-300 text-[10px] font-bold uppercase transition"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleShortcut(7)}
                className="px-2 py-1 rounded-md bg-[#222222] hover:bg-primary hover:text-white text-gray-300 text-[10px] font-bold uppercase transition"
              >
                +7d
              </button>
              <button
                type="button"
                onClick={() => handleShortcut(30)}
                className="px-2 py-1 rounded-md bg-[#222222] hover:bg-primary hover:text-white text-gray-300 text-[10px] font-bold uppercase transition"
              >
                +30d
              </button>
            </div>
          )}

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((name, i) => (
              <span key={i} className="text-[10px] font-black uppercase text-gray-400 py-1">
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((item, idx) => {
              if (!item.currentMonth) {
                return (
                  <div key={idx} className="h-8 flex items-center justify-center text-[11px] text-gray-600 select-none">
                    {item.day}
                  </div>
                );
              }

              return (
                <button
                  type="button"
                  key={idx}
                  disabled={item.isDisabled}
                  onClick={() => handleSelectDay(item.day)}
                  className={`h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition cursor-pointer relative ${
                    item.isSelected
                      ? 'bg-primary text-white font-black shadow-md shadow-red-950/80 scale-105'
                      : item.isDisabled
                      ? 'text-gray-600 opacity-30 cursor-not-allowed'
                      : 'text-gray-200 hover:bg-[#2a2a2a] hover:text-white'
                  } ${item.isToday && !item.isSelected ? 'border border-primary/50 text-primary' : ''}`}
                >
                  {item.day}
                  {item.isToday && !item.isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Footer Actions */}
          <div className="mt-3 pt-2 border-t border-[#262626] flex items-center justify-between text-[11px]">
            <span className="text-gray-400 font-mono text-[10px]">
              {value || "No date selected"}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 hover:text-white rounded-md text-[10px] font-bold uppercase transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
