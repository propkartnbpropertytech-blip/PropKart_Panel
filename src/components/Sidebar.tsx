import React from 'react';
import {
  Building2,
  LayoutDashboard,
  Layers,
  Sliders,
  History,
  LogOut,
  ExternalLink,
  Circle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const { isConnected } = useRealtime();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'submissions', label: 'Property Pool', icon: Layers },
    { id: 'form_builder', label: 'Form Builder', icon: Sliders },
    { id: 'audit_logs', label: 'Audit Trail', icon: History },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-white select-none">
      {/* Top Section */}
      <div className="flex flex-col shrink-0">
        {/* Brand Header */}
        <div className={`h-16 border-b border-slate-200 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/30 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="font-display font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                  <span>PropKart</span>
                  <span className="text-brand-600 font-semibold">Panel</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200/80">v1.0.0</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">Property Pool Desk</div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle / Mobile Close */}
          <div className="flex items-center">
            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
              title="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Realtime Status Indicator */}
        <div className={`py-2 bg-slate-50 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} text-[11px]`}>
          {!isCollapsed && <span className="text-slate-500 font-medium">Realtime Pool</span>}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-200/80 font-medium text-[10px] ${
              isCollapsed ? 'p-1.5' : ''
            }`}
            title={isConnected ? 'Realtime Connected' : 'Sync Active'}
          >
            <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
            {!isCollapsed && (
              <span className={isConnected ? 'text-emerald-700' : 'text-amber-700'}>
                {isConnected ? 'Live Sync' : 'Active'}
              </span>
            )}
          </span>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-2.5'
                } rounded-xl text-xs font-semibold transition-all text-left group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'}`} />
                {!isCollapsed && <span className="tracking-tight truncate">{item.label}</span>}
              </button>
            );
          })}

          {/* Public Connect Portal Link */}
          <div className="pt-3 mt-3 border-t border-slate-200">
            {!isCollapsed && (
              <div className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Public Form
              </div>
            )}
            <a
              href="https://propconnect.nbpropertytech.com"
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? 'Open PropKart Connect' : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2'
              } rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0"></span>
                {!isCollapsed && <span className="font-medium truncate">PropKart Connect</span>}
              </span>
              {!isCollapsed && <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </a>
          </div>
        </nav>
      </div>

      {/* User profile & Logout - Bottom Section */}
      <div className={`border-t border-slate-200 bg-slate-50/80 shrink-0 ${isCollapsed ? 'p-2' : 'p-3.5'}`}>
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between gap-3'}`}>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {user?.full_name || 'Admin User'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {user?.role || 'Property Manager'}{user?.email ? ` • ${user.email}` : ''}
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-200/80 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Non-Scrollable & Adjustable Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-200 z-30 transition-[width] duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
