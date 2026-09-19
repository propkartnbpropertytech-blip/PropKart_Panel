import React, { useState, useEffect } from 'react';
import { Submission, User } from '../types/panel';
import { fetchSubmissions, fetchTelecallers } from '../services/api';
import { useRealtime } from '../context/RealtimeContext';
import { WhatsAppModal } from '../components/WhatsAppModal';
import {
  Search,
  Filter,
  ArrowUpDown,
  Phone,
  MessageSquare,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  RefreshCw,
  Building,
} from 'lucide-react';

interface SubmissionsListProps {
  onSelectSubmission: (id: string) => void;
}

const STATUS_TABS = [
  'All',
  'New',
  'Contact Pending',
  'Contacted',
  'Details Verified',
  'In Progress',
  'Converted',
  'Rejected',
];

export const SubmissionsList: React.FC<SubmissionsListProps> = ({ onSelectSubmission }) => {
  const { refreshCount } = useRealtime();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [telecallers, setTelecallers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [assignedFilter, setAssignedFilter] = useState<string>('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // WhatsApp quick modal
  const [whatsAppTarget, setWhatsAppTarget] = useState<Submission | null>(null);

  useEffect(() => {
    fetchTelecallers().then(setTelecallers).catch(console.error);
  }, []);

  const loadSubmissions = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchSubmissions({
        page,
        limit: pagination.limit,
        search: searchTerm,
        status: selectedStatus === 'All' ? undefined : selectedStatus,
        property_type: propertyTypeFilter || undefined,
        city: cityFilter || undefined,
        assigned_to: assignedFilter || undefined,
        sort_by: 'created_at',
        sort_dir: sortDir,
      });

      setSubmissions(res.submissions);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions(1);
  }, [selectedStatus, propertyTypeFilter, cityFilter, assignedFilter, sortDir, refreshCount]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSubmissions(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Contact Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Contacted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Details Verified':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'In Progress':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Converted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        {/* Status Pipeline Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedStatus(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search & Selectors Row */}
        <div className="flex flex-col md:flex-row gap-3 pt-1">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by owner name, phone, registration code, address..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:outline-none focus:border-brand-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* Property Type Filter */}
          <select
            value={propertyTypeFilter}
            onChange={(e) => setPropertyTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Property Types</option>
            <option value="Apartment">Apartment / Flat</option>
            <option value="Villa">Villa / House</option>
            <option value="Commercial Office">Commercial Office</option>
            <option value="Retail Shop">Retail Shop</option>
            <option value="Plot / Land">Plot / Land</option>
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Cities</option>
            <option value="Ahmedabad">Ahmedabad</option>
            <option value="Surat">Surat</option>
            <option value="Vadodara">Vadodara</option>
            <option value="Rajkot">Rajkot</option>
            <option value="Gandhinagar">Gandhinagar</option>
          </select>

          {/* Telecaller Filter */}
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Telecallers</option>
            <option value="unassigned">Unassigned Only</option>
            {telecallers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>

          {/* Sort Order Toggle */}
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortDir === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <span className="text-xs font-semibold">Loading submissions...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-2">
            <Building className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="font-semibold text-slate-600">No matching property submissions</div>
            <div>Try adjusting your filters or search keywords.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Registration ID</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4">Owner Name</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">City / Area</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Telecaller</th>
                  <th className="py-3.5 px-4 text-center">Media</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const photosCount = (sub.media || []).filter((m) => m.media_type === 'photo').length;
                  const videosCount = (sub.media || []).filter((m) => m.media_type === 'video').length;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => onSelectSubmission(sub.id)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                        {sub.registration_code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 truncate max-w-[140px]">
                        {sub.owner_name || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {sub.owner_phone || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-medium text-slate-900">{sub.property_type || 'Property'}</span>
                        {sub.listing_type && (
                          <span className="text-[10px] text-slate-500 ml-1.5">({sub.listing_type})</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[140px]">
                        {sub.area ? `${sub.area}, ${sub.city}` : sub.city || 'Gujarat'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            sub.status
                          )}`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[120px]">
                        {sub.assigned_user?.full_name || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-[10px] text-slate-500">
                          {photosCount > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <ImageIcon className="w-3 h-3 text-brand-600" />
                              <span className="font-semibold">{photosCount}</span>
                            </span>
                          )}
                          {videosCount > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <VideoIcon className="w-3 h-3 text-emerald-600" />
                              <span className="font-semibold">{videosCount}</span>
                            </span>
                          )}
                          {photosCount === 0 && videosCount === 0 && (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* WhatsApp CTA */}
                          {sub.owner_phone && (
                            <button
                              onClick={() => setWhatsAppTarget(sub)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-colors"
                              title="Send WhatsApp Message"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Call CTA */}
                          {sub.owner_phone && (
                            <a
                              href={`tel:${sub.owner_phone}`}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                              title="Call Owner"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Open Detail Desk */}
                          <button
                            onClick={() => onSelectSubmission(sub.id)}
                            className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold ml-1 transition-colors"
                            title="Open Operations Desk"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50">
          <div>
            Showing <span className="font-semibold text-slate-900">{submissions.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.total}</span> total submissions
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSubmissions(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-700 font-semibold">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => loadSubmissions(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {whatsAppTarget && (
        <WhatsAppModal
          submission={whatsAppTarget}
          isOpen={true}
          onClose={() => setWhatsAppTarget(null)}
        />
      )}
    </div>
  );
};
