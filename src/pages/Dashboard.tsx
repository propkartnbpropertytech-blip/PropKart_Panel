import React, { useEffect, useState } from 'react';
import { SubmissionStats, Submission } from '../types/panel';
import { fetchSubmissionStats, fetchSubmissions } from '../services/api';
import { useRealtime } from '../context/RealtimeContext';
import {
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
  Video as VideoIcon,
  ArrowUpRight,
  PhoneCall,
  MessageSquare,
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
      title: 'Total Submissions',
      value: stats.total,
      sub: 'All-time registrations',
      icon: Users,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    },
    {
      title: "Today's Inflow",
      value: stats.today,
      sub: 'Received since 12:00 AM',
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Pending Contact',
      value: stats.pending_contact,
      sub: 'Awaiting telecaller call',
      icon: PhoneCall,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Contacted / Verified',
      value: stats.contacted,
      sub: 'Initial call completed',
      icon: MessageSquare,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Converted to Inventory',
      value: stats.converted,
      sub: 'Active in PropKart inventory',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Media Assets',
      value: `${stats.photos} / ${stats.videos}`,
      sub: 'Photos / Videos collected',
      icon: ImageIcon,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 tracking-tight">{kpi.title}</span>
                <div className={`p-2 rounded-xl border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-white tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-display text-white">Recent Property Submissions</h2>
            <p className="text-xs text-slate-400">Incoming registrations via PropKart Connect</p>
          </div>
          <button
            onClick={onNavigateSubmissions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
          >
            <span>View All Submissions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-1">
            <Building className="w-8 h-8 text-slate-600 mx-auto" />
            <div>No submissions recorded yet</div>
            <div className="text-[11px] text-slate-400">Fill the form in PropKart Connect to test the flow!</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Registration ID</th>
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => onSelectSubmission(sub.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-brand-400">
                      {sub.registration_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {sub.owner_name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {sub.owner_phone || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {sub.property_type || 'Residential'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {sub.city || 'Gujarat'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-brand-400 hover:text-brand-300 font-semibold text-xs">
                        Open Desk →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
