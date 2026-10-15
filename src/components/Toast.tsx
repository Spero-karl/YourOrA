import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300 max-w-sm">
      <div className="bg-[#1C1917] text-[#FAF7F2] px-4 py-3 rounded-2xl shadow-xl border border-[#3E3832] flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#E6C694]/20 text-[#E6C694] flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="text-xs">
          <p className="font-medium text-[#FAF7F2] font-serif-luxury tracking-wide">{message}</p>
        </div>
      </div>
    </div>
  );
};
