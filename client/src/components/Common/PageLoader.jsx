import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 p-8 animate-fade-in">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 dark:border-slate-800 border-t-blue-600 animate-spin"></div>
        <Loader2 className="w-6 h-6 text-blue-600 absolute inset-0 m-auto animate-pulse" />
      </div>
      <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Loading Module...</p>
    </div>
  );
}
