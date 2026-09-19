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
      color: 'text-brand-600 bg-brand-50 border-brand-200',
    },
    {
      title: "Today's Inflow",
      value: stats.today,
      sub: 'Received since 12:00 AM',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      title: 'Pending Contact',
      value: stats.pending_contact,
      sub: 'Awaiting telecaller call',
      icon: PhoneCall,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      title: 'Contacted / Verified',
      value: stats.contacted,
      sub: 'Initial call completed',
      icon: MessageSquare,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Converted to Inventory',
      value: stats.converted,
      sub: 'Active in PropKart inventory',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Media Assets',
      value: `${stats.photos} / ${stats.videos}`,
      sub: 'Photos / Videos collected',
      icon: ImageIcon,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
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
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 tracking-tight">{kpi.title}</span>
                <div className={`p-2 rounded-xl border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-display text-slate-900">Recent Property Submissions</h2>
            <p className="text-xs text-slate-500">Incoming registrations via PropKart Connect</p>
          </div>
          <button
            onClick={onNavigateSubmissions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            <span>View All Submissions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-1">
            <Building className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="font-semibold text-slate-600">No submissions recorded yet</div>
            <div className="text-[11px] text-slate-400">Fill the form in PropKart Connect to test the flow!</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {recentSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => onSelectSubmission(sub.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-brand-600">
                      {sub.registration_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {sub.owner_name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {sub.owner_phone || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {sub.property_type || 'Residential'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {sub.city || 'Gujarat'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-brand-600 hover:text-brand-700 font-semibold text-xs">
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
