import React from 'react';
import { Menu, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onOpenMobileMenu?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  actions,
  onOpenMobileMenu,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { newSubmissionAlert, dismissAlert, triggerRefresh } = useRealtime();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs shrink-0 select-none">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle in Header */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 -ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold font-display text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Realtime Alert Toast Badge */}
        {newSubmissionAlert && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] sm:text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate max-w-[120px] sm:max-w-none">New Property Inflow!</span>
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
          title="Refresh property pool"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {actions}
      </div>
    </header>
  );
};
