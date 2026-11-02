// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
  CheckCircle2, AlertOctagon, AlertTriangle, Info, X 
} from 'lucide-react';

const ToastContext = createContext(null);

// Global reference so non-React files or utility functions can call toast directly
let globalAddToast = null;

export const toast = {
  success: (msg, duration) => globalAddToast?.(msg, 'success', duration),
  error: (msg, duration) => globalAddToast?.(msg, 'error', duration),
  warning: (msg, duration) => globalAddToast?.(msg, 'warning', duration),
  info: (msg, duration) => globalAddToast?.(msg, 'info', duration)
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return toast;
  }
  return context;
};

// Single Toast Item Component with progress bar and hover-pause
const ToastItem = ({ toast: t, onRemove }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(t.duration || 4000);

  useEffect(() => {
    if (isPaused) return;

    const interval = 25; // 25ms tick
    const totalDuration = t.duration || 4000;

    const timer = setInterval(() => {
      remainingTimeRef.current -= interval;
      const pct = Math.max(0, (remainingTimeRef.current / totalDuration) * 100);
      setProgress(pct);

      if (remainingTimeRef.current <= 0) {
        clearInterval(timer);
        onRemove(t.id);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, t.id, t.duration, onRemove]);

  // Split title and body if multiline (e.g. from alert("Title\nBody"))
  const lines = String(t.message || '').split('\n').filter(Boolean);
  const hasMultipleLines = lines.length > 1;
  const title = hasMultipleLines ? lines[0] : null;
  const body = hasMultipleLines ? lines.slice(1).join('\n') : lines[0] || '';

  // Type-specific icons & colors (Netflix dark aesthetic)
  const typeConfig = {
    success: {
      border: 'border-emerald-500/40',
      bgGlow: 'bg-emerald-950/40',
      barBg: 'bg-emerald-500',
      icon: <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
    },
    error: {
      border: 'border-primary/50',
      bgGlow: 'bg-red-950/40',
      barBg: 'bg-primary',
      icon: <AlertOctagon size={18} className="text-primary shrink-0" />
    },
    warning: {
      border: 'border-amber-500/40',
      bgGlow: 'bg-amber-950/40',
      barBg: 'bg-amber-500',
      icon: <AlertTriangle size={18} className="text-amber-400 shrink-0" />
    },
    info: {
      border: 'border-blue-500/40',
      bgGlow: 'bg-blue-950/40',
      barBg: 'bg-blue-500',
      icon: <Info size={18} className="text-blue-400 shrink-0" />
    }
  };

  const config = typeConfig[t.type] || typeConfig.info;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative overflow-hidden rounded-2xl bg-[#181818]/95 backdrop-blur-md border ${config.border} shadow-2xl shadow-black/80 p-4 text-white transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex items-start gap-3 w-full group pointer-events-auto`}
      role="alert"
    >
      <div className="pt-0.5">{config.icon}</div>

      <div className="flex-1 min-w-0 pr-2">
        {title && (
          <p className="text-xs font-black tracking-tight text-white leading-snug mb-0.5">
            {title}
          </p>
        )}
        <p className={`text-xs ${title ? 'text-gray-300 font-medium' : 'text-white font-bold'} leading-relaxed whitespace-pre-line`}>
          {body}
        </p>
      </div>

      <button
        onClick={() => onRemove(t.id)}
        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>

      {/* Animated Remaining Duration Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#262626]">
        <div 
          className={`h-full ${config.barBg} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', customDuration) => {
    if (!message) return;
    const str = typeof message === 'object' ? JSON.stringify(message) : String(message);
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    // Auto-calculate duration: at least 4s, up to 6.5s for long messages
    const defaultDuration = str.length > 80 ? 6000 : 4000;
    const duration = customDuration || defaultDuration;

    setToasts((prev) => [...prev, { id, message: str, type, duration }]);
    return id;
  }, []);

  // Sync global helper
  useEffect(() => {
    globalAddToast = addToast;
  }, [addToast]);

  // Monkey-patch window.alert globally so that ANY call to alert() uses Toast
  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (msg) => {
      const str = typeof msg === 'object' ? JSON.stringify(msg) : String(msg ?? '');
      if (!str.trim()) return;

      const lower = str.toLowerCase();
      // Smart sentiment classification
      if (
        lower.includes('success') || 
        lower.includes('confirmed') || 
        lower.includes('published') || 
        lower.includes('approved') || 
        lower.includes('verified') || 
        lower.includes('🎉') || 
        lower.includes('thank you') || 
        lower.includes('live') ||
        lower.includes('recorded')
      ) {
        addToast(str, 'success');
      } else if (
        lower.includes('failed') || 
        lower.includes('error') || 
        lower.includes('could not') || 
        lower.includes('denied') || 
        lower.includes('cannot') ||
        lower.includes('locked by someone') ||
        lower.includes('offline') ||
        lower.includes('not found') ||
        lower.includes('invalid')
      ) {
        addToast(str, 'error');
      } else if (
        lower.includes('please') || 
        lower.includes('required') || 
        lower.includes('select') || 
        lower.includes('enter') || 
        lower.includes('warning') || 
        lower.includes('action required') ||
        lower.includes('already')
      ) {
        addToast(str, 'warning');
      } else {
        addToast(str, 'info');
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [addToast]);

  const value = {
    addToast,
    removeToast,
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration)
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Fixed Toast Container (Top-Right on desktop, centered on mobile) */}
      <div 
        aria-live="polite" 
        className="fixed top-5 right-4 sm:right-6 z-[99999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

