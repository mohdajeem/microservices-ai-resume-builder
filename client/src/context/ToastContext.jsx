import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

// --- Individual Toast Component ---
const ToastItem = ({ id, type, message, duration = 4000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // Handle auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => handleClose(), duration);
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - (100 / (duration / 10))));
    }, 10);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 400); // Wait for animation to finish
  };

  // Styles based on type
  const styles = {
    success: { icon: CheckCircle, color: 'text-[#00c29f]', bg: 'bg-[#00c29f]', border: 'border-[#00c29f]/20' },
    error:   { icon: AlertCircle, color: 'text-red-500',    bg: 'bg-red-500',    border: 'border-red-500/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500',  border: 'border-amber-500/20' },
    info:    { icon: Info,        color: 'text-blue-500',   bg: 'bg-blue-500',   border: 'border-blue-500/20' },
  };

  const style = styles[type] || styles.info;
  const Icon = style.icon;

  return (
    <div className={`relative flex items-start gap-3 w-full max-w-sm bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border ${style.border} overflow-hidden mb-3 transition-all ${isExiting ? 'toast-exit-active' : 'toast-enter-active'} toast-enter`}>
      
      {/* Icon Bubble */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.bg} bg-opacity-10 flex items-center justify-center ${style.color}`}>
        <Icon size={20} />
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <h4 className={`text-sm font-bold ${style.color} capitalize`}>{type}</h4>
        <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{message}</p>
      </div>

      {/* Close Button */}
      <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
        <X size={16} />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
        <div 
            className={`h-full ${style.bg}`} 
            style={{ width: `${progress}%`, transition: 'width 10ms linear' }}
        />
      </div>
    </div>
  );
};

// --- Context Provider ---
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Helper functions exposed to the app
  const toast = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration),
    warning: (msg, duration) => addToast('warning', msg, duration),
    info: (msg, duration) => addToast('info', msg, duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container - Fixed Position */}
      <div className="fixed top-24 right-4 z-[9999] flex flex-col items-end pointer-events-none">
        {/* Enable pointer events only on the toasts themselves */}
        <div className="pointer-events-auto">
            {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onClose={removeToast} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};