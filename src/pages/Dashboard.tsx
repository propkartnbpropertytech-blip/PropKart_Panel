import React, { useEffect, useState } from 'react';
import { SubmissionStats, Submission } from '../types/panel';
import { fetchSubmissionStats, fetchSubmissions } from '../services/api';
import { useRealtime } from '../context/RealtimeContext';
import {
  Layers,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface DashboardProps {
  onNavigateSubmissions: () => void;
  onSelectSubmission: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateSubmissions,
  onSelectSubmission,
}) => {
  const { refreshCount } = useRealtime();
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    today: 0,
    pending_contact: 0,
    contacted: 0,
    converted: 0,
    photos: 0,
    videos: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, subData] = await Promise.all([
          fetchSubmissionStats().catch(() => ({
            total: 0,
            today: 0,
            pending_contact: 0,
            contacted: 0,
            converted: 0,
            photos: 0,
            videos: 0,
          })),
          fetchSubmissions({ limit: 6 }).catch(() => ({
            submissions: [],
            pagination: { total: 0, page: 1, limit: 6, totalPages: 1 },
          })),
        ]);
        setStats(statsData);
        setRecentSubmissions(subData.submissions);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [refreshCount]);

  const kpiCards = [
    {
      title: 'Total Pool',
      value: stats.total,
      icon: Layers,
    },
    {
      title: "Today's Inflow",
      value: stats.today,
      icon: Clock,
    },
    {
      title: 'Under Review',
      value: stats.pending_contact,
      icon: ShieldCheck,
    },
    {
      title: 'Verified',
      value: stats.contacted,
      icon: CheckCircle2,
    },
    {
      title: 'Converted',
      value: stats.converted,
      icon: Building,
    },
    {
      title: 'Photos',
      value: stats.photos,
      icon: ImageIcon,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Apple Health style KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-black/[0.06] p-4 sm:p-5 shadow-apple-sm flex flex-col justify-between transition-all hover:shadow-apple"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className="w-7 h-7 rounded-lg bg-black/[0.03] flex items-center justify-center text-slate-600">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
                  {loading ? '—' : kpi.value.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Submissions Section */}
      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-apple-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Recent Submissions</h2>
          </div>
          <button
            onClick={onNavigateSubmissions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-black/[0.04] hover:bg-black/[0.08] active:scale-[0.97] transition-all cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No submissions recorded yet</p>
            <p className="text-xs text-slate-400">New submissions from PropKart Connect will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {recentSubmissions.map((sub) => {
              const isRent = sub.listing_type?.toLowerCase().includes('rent');
              const isSale = sub.listing_type?.toLowerCase().includes('sale') || sub.listing_type?.toLowerCase().includes('resale');

              return (
                <div
                  key={sub.id}
                  onClick={() => onSelectSubmission(sub.id)}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="min-w-0 flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-mono text-xs font-semibold shrink-0">
                      {sub.property_type?.[0] || 'P'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                          {sub.owner_name || 'Anonymous Owner'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
                          {sub.registration_code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {sub.property_type || 'Property'} • {sub.city || 'Gujarat'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {sub.listing_type && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isRent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : isSale
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sub.listing_type}
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                      {new Date(sub.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
