import React, { useState, useEffect } from 'react';
import {
  Menu,
  RefreshCw,
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
  actions,
  onOpenMobileMenu,
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

      try {
        const bc = new BroadcastChannel('propkart_assistance_channel');
        bc.postMessage({ type: 'ASSISTANCE_PHONE_UPDATED', phone: phoneInput.trim() });
        bc.close();
      } catch (e) {
        // fallback
      }

      setFeedback({ type: 'success', message: 'Assistance phone updated.' });
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to update phone:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to update phone.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/75 backdrop-blur-xl border-b border-black/[0.06] flex items-center justify-between px-4 sm:px-6 select-none">
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-black/[0.04] active:scale-95 transition-all lg:hidden"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Actions & Utilities */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {actions}

        {/* Dynamic Assistance Phone Pill */}
        <button
          onClick={handleOpenModal}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-[0.97] transition-all text-xs font-semibold text-slate-700 border border-black/[0.06] group cursor-pointer"
          title="Configure Support Phone Number"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden md:inline text-slate-400 font-normal">Desk:</span>
          <span className="font-mono text-slate-900 font-semibold">{assistancePhone}</span>
          <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors ml-0.5" />
        </button>

        {/* Refresh Button */}
        <button
          onClick={triggerRefresh}
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] active:scale-95 transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Real-time New Submission Toast Notification */}
      {newSubmissionAlert && (
        <div className="absolute top-18 right-6 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-medium">
              New property submission received: <strong className="text-emerald-400 font-mono">{newSubmissionAlert.registration_code}</strong>
            </span>
            <button
              onClick={dismissAlert}
              className="ml-2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Assistance Phone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-apple-lg max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Assistance Number</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 9879458308"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/[0.08] bg-slate-50 focus:bg-white text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/[0.06] transition-all"
                  autoFocus
                />
              </div>

              {feedback && (
                <div
                  className={`flex items-center gap-2 text-xs p-2.5 rounded-xl ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : null}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
