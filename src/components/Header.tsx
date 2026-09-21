import React, { useState, useEffect } from 'react';
import {
  Menu,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  PhoneCall,
  Edit3,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';
import { fetchActiveFormSchema, updateAssistancePhone } from '../services/api';

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

  // Dynamic Assistance Phone State
  const [assistancePhone, setAssistancePhone] = useState<string>('+91 9879458308');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadPhone() {
      try {
        const schema = await fetchActiveFormSchema();
        if (schema && schema.assistance_phone) {
          setAssistancePhone(schema.assistance_phone);
        }
      } catch (err) {
        console.error('Failed to load active assistance phone:', err);
      }
    }
    loadPhone();
  }, []);

  const handleOpenModal = () => {
    setPhoneInput(assistancePhone);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setFeedback({ type: 'error', message: 'Assistance phone cannot be empty.' });
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      await updateAssistancePhone(phoneInput.trim());
      setAssistancePhone(phoneInput.trim());

      // Broadcast to Propkart Connect cross-tab
      try {
        const channel = new BroadcastChannel('propkart_sync');
        channel.postMessage({ type: 'ASSISTANCE_PHONE_UPDATED', phone: phoneInput.trim() });
        channel.close();
      } catch (e) {}
      localStorage.setItem('propkart_assistance_phone', phoneInput.trim());
      localStorage.setItem('propkart_assistance_phone_updated_at', String(Date.now()));

      setFeedback({ type: 'success', message: 'Assistance phone updated successfully!' });
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedback(null);
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update assistance phone.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
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

          {/* Dynamic Assistance Number Config Trigger */}
          <button
            onClick={handleOpenModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Click to edit public assistance phone number displayed in Connect app"
          >
            <PhoneCall className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden lg:inline text-slate-500 font-normal">Assistance:</span>
            <span className="font-mono text-[11px] text-slate-800">{assistancePhone}</span>
            <Edit3 className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Refresh Data Button */}
          <button
            onClick={triggerRefresh}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            title="Refresh property pool"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {actions}
        </div>
      </header>

      {/* Dynamic Assistance Phone Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Header Assistance Number</h3>
                  <p className="text-[11px] text-slate-500">Live contact shown in PropKart Connect portal</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Contact Phone Number
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 98980 12345"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Changes take effect immediately on the public registration header for all users.
                </p>
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Saving...' : 'Save Assistance Number'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
