import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
      {type === 'success' && <CheckCircle className="text-emerald-400" size={18} />}
      {type === 'error' && <AlertCircle className="text-rose-400" size={18} />}
      {type === 'info' && <AlertCircle className="text-indigo-400" size={18} />}
      <span className="text-xs font-semibold text-slate-200">{message}</span>
      <button onClick={onClose} className="text-slate-500 hover:text-white ml-2">
        <X size={14} />
      </button>
    </div>
  );
};
