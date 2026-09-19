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
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-base font-bold font-display text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Realtime Alert Toast Badge */}
        {newSubmissionAlert && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>New Submission Received!</span>
            <button
              onClick={dismissAlert}
              className="ml-1 text-slate-400 hover:text-white text-[10px]"
            >
              ✕
            </button>
          </div>
        )}

        <button
          onClick={triggerRefresh}
          className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
          title="Manual refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {actions}
      </div>
    </header>
  );
};
