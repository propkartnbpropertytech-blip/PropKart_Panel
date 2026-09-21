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
        <div className={`h-16 border-b border-black/[0.06] flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="font-semibold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                  <span>PropKart</span>
                  <span className="text-emerald-600">Panel</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/[0.04] text-slate-500 border border-black/[0.04]">
                    v1.0.0
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {!isOpenMobile && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-black/[0.04] active:scale-95 transition-all"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}

          {/* Mobile Close Button */}
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-black/[0.04] active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Live Status Pill */}
        {!isCollapsed && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="uppercase tracking-wider text-[10px]">Operations</span>
              <div className="flex items-center gap-1.5">
                <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className="text-[10px]">{isConnected ? 'Live Sync' : 'Standby'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? 'bg-[#1d1d1f] text-white shadow-apple-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-black/[0.06] flex flex-col gap-2 shrink-0 bg-white">
        {/* Link to Public Form */}
        <a
          href="https://propconnect.nbpropertytech.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-black/[0.04] transition-all group ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title="Open Public Registration Form"
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          {!isCollapsed && (
            <span className="truncate flex-1 text-left">PropKart Connect</span>
          )}
        </a>

        {/* User Profile & Logout */}
        <div className={`flex items-center justify-between pt-2 border-t border-black/[0.04] ${isCollapsed ? 'flex-col gap-2' : 'px-1'}`}>
          <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-black/[0.06] flex items-center justify-center text-slate-700 text-xs font-semibold shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 text-left">
                <div className="text-xs font-semibold text-slate-800 truncate">{user?.full_name || 'Administrator'}</div>
                <div className="text-[10px] text-slate-400 truncate capitalize">{user?.role || 'Admin'}</div>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Adjustable width) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen border-r border-black/[0.06] bg-white transition-all duration-200 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Responsive slide-in) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/25 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] h-full bg-white shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
