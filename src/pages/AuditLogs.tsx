import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types/panel';
import { ShieldCheck, History, Loader2, Sparkles } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load recent activity
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        action: 'form_version_published',
        changes: { version_number: 1, form: 'Instant Property Registration' },
        created_at: new Date().toISOString(),
        user: { id: 'u1', full_name: 'Admin System', email: 'admin@propkart.com' },
      },
      {
        id: '2',
        action: 'draft_schema_saved',
        changes: { sections_count: 6, fields_count: 26 },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        user: { id: 'u1', full_name: 'Soni Jaykumar', email: 'jay@nbpropertytech.com' },
      },
      {
        id: '3',
        action: 'database_migration_applied',
        changes: { migration: '001_create_dynamic_forms_schema.sql', status: 'success' },
        created_at: new Date(Date.now() - 7200000).toISOString(),
        user: { id: 'u0', full_name: 'Hostinger VPS DevOps', email: 'root@vps' },
      },
    ];
    setLogs(mockLogs);
    setLoading(false);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-display text-slate-900">System Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of form modifications, publishing events, submissions, and telecaller activities.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-700 border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Tamper-Resistant Log</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {JSON.stringify(log.changes)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-slate-800 font-semibold">{log.user?.full_name || 'System'}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
