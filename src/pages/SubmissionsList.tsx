import React, { useState, useEffect } from 'react';
import { Submission } from '../types/panel';
import {
  fetchSubmissions,
  fetchActiveFormSchema,
  deleteSubmission,
  bulkDeleteSubmissions,
  bulkUpdateSubmissionStatus,
  downloadExportZip,
  downloadExportCsv,
} from '../services/api';
import { useRealtime } from '../context/RealtimeContext';
import { WhatsAppModal } from '../components/WhatsAppModal';
import {
  Search,
  ArrowUpDown,
  Phone,
  MessageSquare,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  Building,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Archive,
  CheckSquare,
  Square,
  X,
  Layers,
  ChevronDown,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';

interface SubmissionsListProps {
  onSelectSubmission: (id: string) => void;
}

const STATUS_TABS = [
  'All',
  'New',
  'Under Review',
  'Details Verified',
  'Active Listing',
  'Under Discussion',
  'Reserved',
  'Closed / Sold',
  'Archived',
];

const LIFECYCLE_STATUS_OPTIONS = [
  'New',
  'Under Review',
  'Details Verified',
  'Active Listing',
  'Under Discussion',
  'Reserved',
  'Closed / Sold',
  'Archived',
];

export const SubmissionsList: React.FC<SubmissionsListProps> = ({ onSelectSubmission }) => {
  const { refreshCount } = useRealtime();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Dynamic Form Schema & Dropdown Separation State
  const [dropdownConfigs, setDropdownConfigs] = useState<{
    field_key: string;
    label: string;
    options: { label: string; value: string }[];
  }[]>([
    {
      field_key: 'property_for_rent_or_sale',
      label: 'Property for Rent Or Sale?',
      options: [
        { label: 'Rent', value: 'Rent' },
        { label: 'Re-sale', value: 'Re-sale' },
      ],
    },
  ]);
  const [activeTabFieldKey, setActiveTabFieldKey] = useState<string>('property_for_rent_or_sale');
  const [activeTabOption, setActiveTabOption] = useState<string>('All');
  const [dynamicDropdownFilters, setDynamicDropdownFilters] = useState<Record<string, string>>({});
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // WhatsApp quick modal
  const [whatsAppTarget, setWhatsAppTarget] = useState<Submission | null>(null);

  // Export States
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Bulk Action States
  const [isBulkStatusMenuOpen, setIsBulkStatusMenuOpen] = useState(false);
  const [isBulkUpdatingStatus, setIsBulkUpdatingStatus] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Single Delete States
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Row-level Individual Export States
  const [rowExportOpenId, setRowExportOpenId] = useState<string | null>(null);
  const [rowExportingId, setRowExportingId] = useState<string | null>(null);

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch active form schema to detect dropdowns dynamically
  useEffect(() => {
    async function loadFormDropdowns() {
      try {
        const schema = await fetchActiveFormSchema();
        const extracted: {
          field_key: string;
          label: string;
          options: { label: string; value: string }[];
        }[] = [];

        (schema?.sections || []).forEach((sec: any) => {
          (sec?.fields || []).forEach((f: any) => {
            const fType = String(f.field_type || '').toLowerCase();
            if (fType === 'dropdown' || fType === 'select' || fType === 'radio') {
              const opts = (f.options || []).map((o: any) => {
                if (typeof o === 'string') return { label: o, value: o };
                return {
                  label: o.label || o.value || String(o),
                  value: o.value || o.label || String(o),
                };
              });
              if (opts.length > 0) {
                extracted.push({
                  field_key: f.field_key,
                  label: f.label || f.field_key,
                  options: opts,
                });
              }
            }
          });
        });

        if (extracted.length > 0) {
          setDropdownConfigs(extracted);
          const primary =
            extracted.find(
              (c) =>
                c.field_key.toLowerCase().includes('rent') ||
                c.field_key.toLowerCase().includes('sale') ||
                c.field_key.toLowerCase().includes('listing') ||
                c.label.toLowerCase().includes('rent') ||
                c.label.toLowerCase().includes('sale')
            ) || extracted[0];

          if (primary) {
            setActiveTabFieldKey(primary.field_key);
          }
        }
      } catch (err) {
        console.error('Failed to load active form schema for dynamic dropdowns:', err);
      }
    }
    loadFormDropdowns();
  }, [refreshCount]);

  // Compute live counts for each option in active dropdown
  const computeCounts = async (configs: typeof dropdownConfigs, currentTabKey: string) => {
    try {
      const allRes = await fetchSubmissions({ limit: 1000 });
      const subs = allRes.submissions || [];

      const currentField = configs.find((c) => c.field_key === currentTabKey);
      const counts: Record<string, number> = { All: subs.length };

      if (currentField) {
        currentField.options.forEach((opt) => {
          const optVal = opt.value.toLowerCase().trim();
          const count = subs.filter((s: Submission) => {
            const rawVal = String(s.raw_data?.[currentTabKey] || '').toLowerCase().trim();
            const listVal = String(s.listing_type || '').toLowerCase().trim();
            const propVal = String(s.property_type || '').toLowerCase().trim();

            if (
              currentTabKey.includes('rent') ||
              currentTabKey.includes('sale') ||
              currentTabKey.includes('listing')
            ) {
              const optClean = optVal.replace(/[^a-z0-9]/g, '');
              const listClean = listVal.replace(/[^a-z0-9]/g, '');
              const rawClean = rawVal.replace(/[^a-z0-9]/g, '');
              return (
                listClean === optClean ||
                rawClean === optClean ||
                (optClean.includes('rent') && (listClean.includes('rent') || rawClean.includes('rent'))) ||
                (optClean.includes('sale') && (listClean.includes('sale') || rawClean.includes('sale')))
              );
            }

            return rawVal === optVal || listVal === optVal || propVal === optVal;
          }).length;

          counts[opt.value] = count;
        });
      }

      setTabCounts(counts);
    } catch (e) {
      console.error('Failed to compute tab counts:', e);
    }
  };

  useEffect(() => {
    if (dropdownConfigs.length > 0) {
      computeCounts(dropdownConfigs, activeTabFieldKey);
    }
  }, [dropdownConfigs, activeTabFieldKey, refreshCount]);

  const loadSubmissions = async (page = 1) => {
    setLoading(true);
    try {
      // Determine if active tab or dynamic filters map to listing_type
      let listingTypeParam: string | undefined = undefined;

      const isRentSaleKey = (k: string) =>
        k.toLowerCase().includes('rent') ||
        k.toLowerCase().includes('sale') ||
        k.toLowerCase().includes('listing');

      if (activeTabOption !== 'All' && isRentSaleKey(activeTabFieldKey)) {
        listingTypeParam = activeTabOption;
      }

      // Also check dynamic dropdown filters for listing type
      for (const [k, v] of Object.entries(dynamicDropdownFilters)) {
        if (v && isRentSaleKey(k)) {
          listingTypeParam = v;
        }
      }

      const res = await fetchSubmissions({
        page,
        limit: pagination.limit,
        search: searchTerm,
        status: selectedStatus === 'All' ? undefined : selectedStatus,
        property_type: propertyTypeFilter || undefined,
        city: cityFilter || undefined,
        listing_type: listingTypeParam,
        sort_by: 'created_at',
        sort_dir: sortDir,
      });

      let filteredList = res.submissions;

      // In-memory filter for any non-listing_type dynamic dropdown filter or non-listing_type tab
      if (activeTabOption !== 'All' && !isRentSaleKey(activeTabFieldKey)) {
        filteredList = filteredList.filter((s) => {
          const val = s.raw_data?.[activeTabFieldKey] || (s as any)[activeTabFieldKey];
          return String(val || '').toLowerCase() === activeTabOption.toLowerCase();
        });
      }

      for (const [k, v] of Object.entries(dynamicDropdownFilters)) {
        if (v && !isRentSaleKey(k)) {
          filteredList = filteredList.filter((s) => {
            const val = s.raw_data?.[k] || (s as any)[k];
            return String(val || '').toLowerCase() === v.toLowerCase();
          });
        }
      }

      setSubmissions(filteredList);
      setPagination({
        ...res.pagination,
        total:
          activeTabOption !== 'All' || Object.values(dynamicDropdownFilters).some(Boolean)
            ? filteredList.length
            : res.pagination.total,
      });
    } catch (err) {
      console.error('Failed to load property pool:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions(1);
  }, [
    selectedStatus,
    propertyTypeFilter,
    cityFilter,
    sortDir,
    refreshCount,
    activeTabOption,
    activeTabFieldKey,
    dynamicDropdownFilters,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSubmissions(1);
  };

  // Selection Handlers
  const isAllCurrentPageSelected =
    submissions.length > 0 && submissions.every((s) => selectedIds.includes(s.id));

  const toggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(submissions.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newSelected = new Set([...selectedIds, ...submissions.map((s) => s.id)]);
      setSelectedIds(Array.from(newSelected));
    }
  };

  const toggleSelectOne = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Export Handlers (Supports selected or all)
  const handleExportCsv = async (exportSelectedOnly = false) => {
    setIsExportingCsv(true);
    setIsExportMenuOpen(false);
    try {
      const idsToExport = exportSelectedOnly && selectedIds.length > 0 ? selectedIds : undefined;
      await downloadExportCsv(idsToExport);
      showToast(
        idsToExport
          ? `CSV export of ${idsToExport.length} selected properties downloaded.`
          : 'Complete CSV property data export downloaded.'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to export CSV report');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportZip = async (exportSelectedOnly = false) => {
    setIsExportingZip(true);
    setIsExportMenuOpen(false);
    try {
      const idsToExport = exportSelectedOnly && selectedIds.length > 0 ? selectedIds : undefined;
      await downloadExportZip(idsToExport);
      showToast(
        idsToExport
          ? `ZIP package with photos for ${idsToExport.length} selected properties downloaded.`
          : 'Complete ZIP package with data & photos downloaded.'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to export ZIP package');
    } finally {
      setIsExportingZip(false);
    }
  };

  // Row-level Individual Export Handlers
  const handleRowExportCsv = async (sub: Submission) => {
    setRowExportingId(sub.id);
    setRowExportOpenId(null);
    try {
      await downloadExportCsv([sub.id]);
      showToast(`CSV data for ${sub.registration_code} downloaded.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to export CSV');
    } finally {
      setRowExportingId(null);
    }
  };

  const handleRowExportZip = async (sub: Submission) => {
    setRowExportingId(sub.id);
    setRowExportOpenId(null);
    try {
      await downloadExportZip([sub.id]);
      showToast(`ZIP with photos for ${sub.registration_code} downloaded.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to export ZIP');
    } finally {
      setRowExportingId(null);
    }
  };

  // Single Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSubmission(deleteTarget.id);
      showToast(`Property ${deleteTarget.registration_code} deleted permanently.`);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
      await loadSubmissions(pagination.page);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete property entry');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await bulkDeleteSubmissions(selectedIds);
      showToast(`Permanently deleted ${res.data?.count || selectedIds.length} properties.`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      await loadSubmissions(pagination.page);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete selected properties');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdatingStatus(true);
    setIsBulkStatusMenuOpen(false);
    try {
      const res = await bulkUpdateSubmissionStatus(selectedIds, newStatus);
      showToast(`Updated ${res.data?.count || selectedIds.length} properties to "${newStatus}".`);
      setSelectedIds([]);
      await loadSubmissions(pagination.page);
    } catch (err: any) {
      showToast(err.message || 'Failed to update status');
    } finally {
      setIsBulkUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Details Verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Active Listing':
        return 'bg-brand-50 text-brand-700 border-brand-200';
      case 'Under Discussion':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Reserved':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Closed / Sold':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const activeTabField =
    dropdownConfigs.find((c) => c.field_key === activeTabFieldKey) || dropdownConfigs[0];

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Filter & Pipeline Tabs Bar */}
      <div className="bg-white border border-black/[0.06] rounded-3xl p-4 sm:p-5 shadow-apple-sm space-y-3.5">
        {/* Dynamic Dropdown Separation Tabs (Rent, Re-sale, or custom form builder dropdowns) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
          <div className="bg-black/[0.04] p-1 rounded-full inline-flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none">
            {/* All Properties Tab */}
            <button
              type="button"
              onClick={() => setActiveTabOption('All')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activeTabOption === 'All'
                  ? 'bg-white text-slate-900 shadow-apple-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Properties</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                  activeTabOption === 'All'
                    ? 'bg-slate-100 text-slate-800'
                    : 'bg-black/[0.05] text-slate-500'
                }`}
              >
                {tabCounts['All'] ?? pagination.total}
              </span>
            </button>

            {/* Dynamic Options Tabs from Form Builder */}
            {activeTabField?.options.map((opt) => {
              const isActive = activeTabOption === opt.value;
              const count = tabCounts[opt.value] ?? 0;
              const isRent = opt.value.toLowerCase().includes('rent');
              const isSale =
                opt.value.toLowerCase().includes('sale') ||
                opt.value.toLowerCase().includes('resale');

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setActiveTabOption(opt.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-apple-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRent
                        ? 'bg-emerald-500'
                        : isSale
                        ? 'bg-indigo-500'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span>{opt.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      isActive
                        ? 'bg-slate-100 text-slate-800'
                        : 'bg-black/[0.05] text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Driver Switcher if multiple dropdowns configured in Form Builder */}
          {dropdownConfigs.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium hidden sm:inline">Tabs by:</span>
              <select
                value={activeTabFieldKey}
                onChange={(e) => {
                  setActiveTabFieldKey(e.target.value);
                  setActiveTabOption('All');
                }}
                className="px-3 py-1 rounded-full bg-slate-50 border border-black/[0.08] text-slate-700 text-xs font-medium focus:bg-white focus:outline-none cursor-pointer"
              >
                {dropdownConfigs.map((cfg) => (
                  <option key={cfg.field_key} value={cfg.field_key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Pipeline Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedStatus(tab)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] ${
                  isActive
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search & Selectors Row */}
        <div className="flex flex-col md:flex-row gap-2.5 pt-1">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by owner name, phone, reference code, city..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-slate-50/70 border border-black/[0.08] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/[0.04] transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* Controls Group */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            {/* Dynamic Dropdown Filters */}
            {dropdownConfigs
              .filter((cfg) => cfg.field_key !== activeTabFieldKey)
              .map((cfg) => (
                <select
                  key={cfg.field_key}
                  value={dynamicDropdownFilters[cfg.field_key] || ''}
                  onChange={(e) =>
                    setDynamicDropdownFilters((prev) => ({
                      ...prev,
                      [cfg.field_key]: e.target.value,
                    }))
                  }
                  className="flex-1 sm:flex-none px-3 py-2 rounded-full bg-slate-50/70 border border-black/[0.08] text-slate-700 text-xs font-medium focus:bg-white focus:outline-none"
                >
                  <option value="">All {cfg.label}</option>
                  {cfg.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ))}

            {/* Property Type Filter */}
            <select
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-full bg-slate-50/70 border border-black/[0.08] text-slate-700 text-xs font-medium focus:bg-white focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Commercial Office">Commercial</option>
              <option value="Retail Shop">Shop</option>
              <option value="Plot / Land">Plot</option>
            </select>

            {/* City Filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-full bg-slate-50/70 border border-black/[0.08] text-slate-700 text-xs font-medium focus:bg-white focus:outline-none"
            >
              <option value="">All Cities</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Surat">Surat</option>
              <option value="Vadodara">Vadodara</option>
              <option value="Rajkot">Rajkot</option>
              <option value="Gandhinagar">Gandhinagar</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-50/70 border border-black/[0.08] text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer shrink-0 active:scale-95"
              title="Toggle sort order"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span className="hidden sm:inline">{sortDir === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>

            {/* Standard Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
                title="Export submissions"
              >
                {isExportingCsv || isExportingZip ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Export</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isExportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                    {/* Selected Export Options (if items selected) */}
                    {selectedIds.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-bold text-brand-600 uppercase tracking-wider bg-brand-50 rounded-lg">
                          Export Selected ({selectedIds.length} items)
                        </div>
                        <button
                          type="button"
                          onClick={() => handleExportCsv(true)}
                          disabled={isExportingCsv}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900">Selected Data (CSV)</div>
                            <div className="text-[10px] text-slate-500">Spreadsheet for {selectedIds.length} properties</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportZip(true)}
                          disabled={isExportingZip}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Archive className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900">Selected ZIP Package</div>
                            <div className="text-[10px] text-slate-500">Data + photos for {selectedIds.length} properties</div>
                          </div>
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Entire Property Pool
                        </div>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleExportCsv(false)}
                      disabled={isExportingCsv}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        {isExportingCsv ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Export All (CSV)</div>
                        <div className="text-[10px] text-slate-500">Spreadsheet report (no photos)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportZip(false)}
                      disabled={isExportingZip}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                        {isExportingZip ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Export All (ZIP Package)</div>
                        <div className="text-[10px] text-slate-500">Full archive + all photos</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Multi-Selection Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-20 bg-slate-900 text-white rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center font-mono font-bold text-xs shadow-inner">
              {selectedIds.length}
            </div>
            <div className="text-xs">
              <span className="font-bold text-white">
                {selectedIds.length} {selectedIds.length === 1 ? 'property' : 'properties'} selected
              </span>
              <span className="text-slate-400 hidden sm:inline ml-1.5 text-[11px]">
                (of {pagination.total} total)
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
              title="Deselect All"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Export CSV */}
            <button
              type="button"
              onClick={() => handleExportCsv(true)}
              disabled={isExportingCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Export selected items to CSV spreadsheet"
            >
              {isExportingCsv ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">Export</span> CSV
            </button>

            {/* Bulk Export ZIP */}
            <button
              type="button"
              onClick={() => handleExportZip(true)}
              disabled={isExportingZip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Export selected items with photos to ZIP"
            >
              {isExportingZip ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              ) : (
                <Archive className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="hidden sm:inline">Export</span> ZIP
            </button>

            {/* Bulk Status Change Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBulkStatusMenuOpen((prev) => !prev)}
                disabled={isBulkUpdatingStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                title="Change status for selected properties"
              >
                {isBulkUpdatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-brand-400" />
                )}
                <span>Status</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
              </button>

              {isBulkStatusMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsBulkStatusMenuOpen(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 z-40 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Set Status For {selectedIds.length} Items:
                    </div>
                    {LIFECYCLE_STATUS_OPTIONS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleBulkStatusChange(st)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors flex items-center justify-between"
                      >
                        <span>{st}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            st === 'New'
                              ? 'bg-blue-500'
                              : st === 'Active Listing'
                              ? 'bg-brand-500'
                              : st === 'Closed / Sold'
                              ? 'bg-slate-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bulk Delete Button */}
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Delete all selected properties"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Property Pool Table Container */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <span className="text-xs font-semibold">Loading property pool...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-2">
            <Building className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="font-semibold text-slate-700">No matching properties found</div>
            <div className="text-slate-400">Try adjusting your search terms or filters.</div>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  {/* Select All Checkbox Header */}
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                      title={isAllCurrentPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                    />
                  </th>
                  <th className="py-3.5 px-3">Reference ID</th>
                  <th className="py-3.5 px-3">Inflow Date</th>
                  <th className="py-3.5 px-3">Owner Name</th>
                  <th className="py-3.5 px-3">Mobile</th>
                  <th className="py-3.5 px-3">Type</th>
                  <th className="py-3.5 px-3">Location</th>
                  <th className="py-3.5 px-3">Pool Status</th>
                  <th className="py-3.5 px-3 text-center">Media</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const isSelected = selectedIds.includes(sub.id);
                  const photosCount = (sub.media || []).filter((m) => m.media_type === 'photo').length;
                  const videosCount = (sub.media || []).filter((m) => m.media_type === 'video').length;

                  return (
                    <tr
                      key={sub.id}
                      className={`transition-colors group cursor-pointer ${
                        isSelected ? 'bg-brand-50/70 hover:bg-brand-50' : 'hover:bg-slate-50/80'
                      }`}
                      onClick={() => onSelectSubmission(sub.id)}
                    >
                      {/* Row Checkbox */}
                      <td
                        className="py-3.5 px-3 w-10 text-center"
                        onClick={(e) => toggleSelectOne(sub.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by td onClick
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-brand-600 whitespace-nowrap">
                        {sub.registration_code}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-900 truncate max-w-[130px]">
                        {sub.owner_name || 'N/A'}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {sub.owner_phone || 'N/A'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                        {(() => {
                          const displayListingType =
                            sub.listing_type ||
                            sub.raw_data?.property_for_rent_or_sale ||
                            sub.raw_data?.listing_type ||
                            '';
                          const isRent = displayListingType.toLowerCase().includes('rent');
                          const isSale =
                            displayListingType.toLowerCase().includes('sale') ||
                            displayListingType.toLowerCase().includes('resale');

                          return (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="font-semibold text-slate-900">{sub.property_type || 'Property'}</span>
                              {displayListingType ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isRent
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isSale
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-brand-50 text-brand-700 border-brand-200'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isRent
                                        ? 'bg-emerald-500'
                                        : isSale
                                        ? 'bg-indigo-500'
                                        : 'bg-brand-500'
                                    }`}
                                  />
                                  {displayListingType}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Unspecified</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 truncate max-w-[150px]">
                        {(() => {
                          const a = sub.area && sub.area !== 'null' ? sub.area.trim() : '';
                          const c = sub.city && sub.city !== 'null' ? sub.city.trim() : '';
                          if (a && c) return `${a}, ${c}`;
                          if (a) return a;
                          if (c) return c;
                          return 'Gujarat';
                        })()}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            sub.status
                          )}`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-[10px] text-slate-500">
                          {photosCount > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                              <span className="font-semibold">{photosCount}</span>
                            </span>
                          )}
                          {videosCount > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <VideoIcon className="w-3.5 h-3.5 text-emerald-600" />
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
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-colors cursor-pointer"
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
                              <Phone className="w-3.5 h-3.5 text-brand-600" />
                            </a>
                          )}

                          {/* Open Dossier */}
                          <button
                            onClick={() => onSelectSubmission(sub.id)}
                            className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold ml-1 transition-colors cursor-pointer"
                            title="Open Property Dossier"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Row-level Individual Export Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setRowExportOpenId((prev) => (prev === sub.id ? null : sub.id))}
                              disabled={rowExportingId === sub.id}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-colors cursor-pointer ml-1 disabled:opacity-50"
                              title="Export this property (CSV or ZIP with Photos)"
                            >
                              {rowExportingId === sub.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {rowExportOpenId === sub.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setRowExportOpenId(null)}
                                />
                                <div className="absolute right-0 bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100 space-y-1">
                                  <div className="px-2.5 py-1 text-[10px] font-bold text-brand-600 uppercase tracking-wider bg-brand-50 rounded-lg">
                                    Export {sub.registration_code}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRowExportCsv(sub)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-700 font-medium transition-colors cursor-pointer"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <div>
                                      <div className="font-semibold text-slate-900 text-[11px]">CSV Data</div>
                                      <div className="text-[9px] text-slate-500">Data spreadsheet (no photos)</div>
                                    </div>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRowExportZip(sub)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-700 font-medium transition-colors cursor-pointer"
                                  >
                                    <Archive className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <div>
                                      <div className="font-semibold text-slate-900 text-[11px]">ZIP Package</div>
                                      <div className="text-[9px] text-slate-500">Data + property photos</div>
                                    </div>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Row-level Delete Button */}
                          <button
                            onClick={() => setDeleteTarget(sub)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer ml-1"
                            title="Permanently Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Apple Cards View (Visible on screens < 768px) */}
          <div className="md:hidden divide-y divide-black/[0.06]">
            {/* Mobile Select All Bar */}
            <div className="p-3 bg-slate-50/70 border-b border-black/[0.06] flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-slate-900 border-slate-300"
                />
                <span>Select All ({submissions.length})</span>
              </label>
              {selectedIds.length > 0 && (
                <span className="font-semibold text-emerald-600 font-mono text-[11px]">
                  {selectedIds.length} Selected
                </span>
              )}
            </div>

            {submissions.map((sub) => {
              const isSelected = selectedIds.includes(sub.id);
              const photosCount = (sub.media || []).filter((m) => m.media_type === 'photo').length;
              const videosCount = (sub.media || []).filter((m) => m.media_type === 'video').length;
              const displayListingType =
                sub.listing_type ||
                sub.raw_data?.property_for_rent_or_sale ||
                sub.raw_data?.listing_type ||
                '';
              const isRent = displayListingType.toLowerCase().includes('rent');
              const isSale =
                displayListingType.toLowerCase().includes('sale') ||
                displayListingType.toLowerCase().includes('resale');

              return (
                <div
                  key={sub.id}
                  onClick={() => onSelectSubmission(sub.id)}
                  className={`p-4 space-y-3 transition-colors cursor-pointer active:bg-slate-50 ${
                    isSelected ? 'bg-emerald-50/50' : 'bg-white hover:bg-slate-50/60'
                  }`}
                >
                  {/* Top Bar: Checkbox + Code + Badges */}
                  <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={(e) => toggleSelectOne(sub.id, e)}
                        className="w-4 h-4 rounded text-slate-900 border-slate-300"
                      />
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {sub.registration_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {displayListingType && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isRent
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : isSale
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {displayListingType}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(sub.status)}`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>

                  {/* Property & Owner Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Owner</div>
                      <div className="font-semibold text-slate-900 truncate">{sub.owner_name || 'N/A'}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{sub.owner_phone || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Property</div>
                      <div className="text-slate-500 truncate">
                        {(() => {
                          const a = sub.area && sub.area !== 'null' ? sub.area.trim() : '';
                          const c = sub.city && sub.city !== 'null' ? sub.city.trim() : '';
                          if (a && c) return `${a}, ${c}`;
                          if (a) return a;
                          if (c) return c;
                          return 'Gujarat';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar: Media Indicators & Quick Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] text-xs">
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      {photosCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{photosCount}</span>
                        </span>
                      )}
                      {videosCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <VideoIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{videosCount}</span>
                        </span>
                      )}
                      <span>
                        {new Date(sub.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {sub.owner_phone && (
                        <button
                          onClick={() => setWhatsAppTarget(sub)}
                          className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {sub.owner_phone && (
                        <a
                          href={`tel:${sub.owner_phone}`}
                          className="p-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-slate-700 border border-black/[0.06]"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => onSelectSubmission(sub.id)}
                        className="p-1.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white"
                        title="View Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

        {/* Pagination Bar */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50">
          <div>
            Showing <span className="font-semibold text-slate-900">{submissions.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.total}</span> total properties in pool
            {selectedIds.length > 0 && (
              <span className="ml-2 font-semibold text-brand-600">
                ({selectedIds.length} selected)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSubmissions(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-700 font-semibold">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => loadSubmissions(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Single Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Permanently Delete Entry?
              </h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete registration{' '}
                <strong className="font-mono text-brand-600">{deleteTarget.registration_code}</strong> (
                {deleteTarget.owner_name})?
              </p>
              <p className="text-[11px] text-rose-600 font-medium pt-1">
                This will wipe all submitted property data and permanently remove uploaded photos/videos from disk. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Permanently Delete {selectedIds.length} Properties?
              </h3>
              <p className="text-xs text-slate-600">
                You have selected <strong className="font-bold text-slate-900">{selectedIds.length}</strong> properties
                to delete permanently.
              </p>
              <p className="text-[11px] text-rose-600 font-medium pt-1">
                All submitted property records and associated photos/videos on local disk will be wiped. This action is irreversible.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                {isBulkDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isBulkDeleting ? 'Deleting...' : `Delete All ${selectedIds.length}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
