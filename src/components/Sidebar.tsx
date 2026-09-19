import React from 'react';
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  Sliders,
  History,
  LogOut,
  ExternalLink,
  Circle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useRealtime();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'submissions', label: 'Property Submissions', icon: ClipboardList },
    { id: 'form_builder', label: 'Form Builder', icon: Sliders },
    { id: 'audit_logs', label: 'Audit Trail', icon: History },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>PropKart</span>
              <span className="text-brand-600 font-semibold">Panel</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Operations Desk</div>
          </div>
        </div>
      </div>

      {/* Realtime Status Indicator */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Realtime Engine</span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-200/80 font-medium text-[10px]">
          <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className={isConnected ? 'text-emerald-700' : 'text-amber-700'}>
            {isConnected ? 'Connected' : 'Sync Active'}
          </span>
        </span>
      </div>

      {/* Navigation links */}
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Public Connect Portal Link */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
            Public Gateway
          </div>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600"></span>
              <span className="font-medium">PropKart Connect</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate">
              {user?.full_name || 'Telecaller User'}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {user?.role} • {user?.email}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
