import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('Propkart@123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow textures */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight">
            PropKart <span className="text-brand-600 font-semibold">Panel</span>
          </h1>
          <p className="text-xs text-slate-500">
            Property Pool Management & Dynamic Forms
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username / Email</label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin or admin@propkart.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:outline-none focus:border-brand-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:outline-none focus:border-brand-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Panel</span>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Authorized Pool Management Access</span>
        </div>
      </div>
    </div>
  );
};
