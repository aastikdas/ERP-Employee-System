import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, description }) => {
  return (
    <div className="p-10 flex flex-col items-center justify-center text-center">
      <div className="p-3 bg-slate-800/20 text-slate-500 rounded-full mb-3 border border-slate-800/40">
        <AlertCircle size={24} />
      </div>
      <p className="text-slate-300 font-semibold text-sm">{message}</p>
      {description && <p className="text-slate-500 text-xs mt-1 max-w-sm leading-relaxed">{description}</p>}
    </div>
  );
};
