import React from 'react';
import { Bell, RefreshCw, Smartphone, Laptop } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const { newSubmissionAlert, dismissAlert, triggerRefresh } = useRealtime();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-base font-bold font-display text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Realtime Alert Toast Badge */}
        {newSubmissionAlert && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>New Submission Received!</span>
            <button
              onClick={dismissAlert}
              className="ml-1 text-slate-400 hover:text-slate-700 text-[10px]"
            >
              ✕
            </button>
          </div>
        )}

        <button
          onClick={triggerRefresh}
          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
          title="Manual refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {actions}
      </div>
    </header>
  );
};
