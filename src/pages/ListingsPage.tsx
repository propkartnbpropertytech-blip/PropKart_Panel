import React, { useState, useEffect, useMemo } from 'react';
import { ListingProperty, ListingType, ListingCategory, ApprovalStatus } from '../types/panel';
import {
  fetchListings,
  togglePropertyPublish,
  approveListingProperty,
  rejectListingProperty,
  syncDatabaseSubmissions,
  deleteListingProperty,
} from '../services/listingsService';
import { AddPreSalesModal } from '../components/AddPreSalesModal';
import { EditPropertyModal } from '../components/EditPropertyModal';
import { PublicLandingPage } from '../components/PublicLandingPage';
import {
  Building2,
  Plus,
  Eye,
  Pencil,
  Search,
  Filter,
  Layers,
  MapPin,
  IndianRupee,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles,
  Home,
  Briefcase,
  Factory,
  Trees,
  SlidersHorizontal,
  RefreshCw,
  X,
  Check,
  ShieldCheck,
  Clock,
  Phone,
  User,
  AlertTriangle,
  Video as VideoIcon,
  Play,
} from 'lucide-react';

export const ListingsPage: React.FC = () => {
  const [properties, setProperties] = useState<ListingProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isLandingPreviewOpen, setIsLandingPreviewOpen] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<ListingProperty | null>(null);
  const [inspectImageIdx, setInspectImageIdx] = useState<number>(0);
  const [editingProperty, setEditingProperty] = useState<ListingProperty | null>(null);

  // Approval Status Filter: 'all' | 'pending' | 'approved' | 'rejected'
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Transaction Tab: 'all' | 'Rent' | 'Re-sale' | 'Pre-sales'
  const [activeTab, setActiveTab] = useState<string>('all');

  // Sub-category Filter: 'all' | 'Residential' | 'Commercial' | 'Industrial' | 'Land & Plot'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'unpublished'>('all');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await fetchListings();
      setProperties(data);
    } catch (e) {
      console.error('Failed to load listings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();

    // Listen for cross-tab updates (e.g. from PreSales or Listing app)
    const channel = new BroadcastChannel('propkart_listing_channel');
    channel.onmessage = () => {
      loadProperties();
    };

    return () => {
      channel.close();
    };
  }, []);

  // Sync Submissions from Database
  const handleSyncDatabase = async () => {
    setSyncing(true);
    try {
      const updated = await syncDatabaseSubmissions();
      setProperties(updated);
      showToast('🔄 Synchronized latest submissions from database into Listings queue!');
    } catch (err: any) {
      showToast('Failed to sync submissions: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Handle Approve
  const handleApprove = async (id: string, isPublished = true, title: string) => {
    try {
      const updated = await approveListingProperty(id, isPublished);
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      if (selectedProperty?.id === id) {
        setSelectedProperty((prev) => (prev ? { ...prev, ...updated } : null));
      }
      showToast(
        isPublished
          ? `✅ "${title}" APPROVED and published live on the Listing Showcase!`
          : `✅ "${title}" APPROVED (ready to publish when toggled ON).`
      );
    } catch (err: any) {
      alert('Failed to approve property: ' + err.message);
    }
  };

  // Handle Reject
  const handleReject = async (id: string, title: string) => {
    const reason = window.prompt(`Enter rejection reason for "${title}":`, 'Does not meet verification standards');
    if (reason === null) return; // User cancelled
    try {
      const updated = await rejectListingProperty(id, reason);
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      if (selectedProperty?.id === id) {
        setSelectedProperty((prev) => (prev ? { ...prev, ...updated } : null));
      }
      showToast(`❌ "${title}" rejected.`);
    } catch (err: any) {
      alert('Failed to reject property: ' + err.message);
    }
  };

  // Handle Toggle Switch
  const handleToggle = async (id: string, currentStatus: boolean, title: string, isApproved?: boolean) => {
    if (!currentStatus && !isApproved) {
      alert(`Cannot show on web: "${title}" is currently Pending Approval. Please approve this property first before publishing.`);
      return;
    }

    try {
      const updated = await togglePropertyPublish(id);
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_published: updated.is_published } : p))
      );
      if (selectedProperty?.id === id) {
        setSelectedProperty((prev) => (prev ? { ...prev, is_published: updated.is_published } : null));
      }
      showToast(
        updated.is_published
          ? `🟢 "${title}" is now LIVE on the Public Showcase!`
          : `⚪ "${title}" is now HIDDEN from the Public Showcase.`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle property visibility.');
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}" from inventory?`)) return;
    try {
      await deleteListingProperty(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      if (selectedProperty?.id === id) setSelectedProperty(null);
      if (editingProperty?.id === id) setEditingProperty(null);
      showToast(`🗑️ "${title}" was permanently removed from inventory.`);
    } catch (err: any) {
      alert('Failed to delete property: ' + err.message);
    }
  };

  // Handle Edit Success
  const handleEditSuccess = (updated: ListingProperty) => {
    setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedProperty?.id === updated.id) setSelectedProperty(updated);
    showToast(`✨ "${updated.title}" updated successfully!`);
  };

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // 1. Approval Filter
      const isApproved = p.is_approved === true || p.approval_status === 'Approved';
      const isRejected = p.approval_status === 'Rejected';
      const isPending = !isApproved && !isRejected;

      if (approvalFilter === 'pending' && !isPending) return false;
      if (approvalFilter === 'approved' && !isApproved) return false;
      if (approvalFilter === 'rejected' && !isRejected) return false;

      // 2. Transaction Tab: Rent, Re-sale, Pre-sales
      if (activeTab !== 'all' && p.listing_type !== activeTab) return false;

      // 3. Category Filter (Residential, Commercial, Industrial, Land & Plot)
      if (selectedCategory !== 'all' && p.property_category !== selectedCategory) {
        return false;
      }

      // 4. Publish Toggle Filter
      if (publishFilter === 'published' && !p.is_published) return false;
      if (publishFilter === 'unpublished' && p.is_published) return false;

      // 5. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesLocality = (p.locality || '').toLowerCase().includes(q);
        const matchesCity = (p.city || '').toLowerCase().includes(q);
        const matchesDeveloper = (p.developer || p.owner_name || '').toLowerCase().includes(q);
        const matchesCode = (p.registration_code || '').toLowerCase().includes(q);
        const matchesSubtype = (p.property_sub_type || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocality && !matchesCity && !matchesDeveloper && !matchesCode && !matchesSubtype) {
          return false;
        }
      }

      return true;
    });
  }, [properties, approvalFilter, activeTab, selectedCategory, publishFilter, searchQuery]);

  // KPI Metrics
  const stats = useMemo(() => {
    const pendingCount = properties.filter(
      (p) => p.approval_status === 'Pending' || (!p.is_approved && p.approval_status !== 'Rejected')
    ).length;
    const approvedCount = properties.filter((p) => p.is_approved === true || p.approval_status === 'Approved').length;
    const publishedCount = properties.filter((p) => p.is_published && (p.is_approved || p.approval_status === 'Approved')).length;
    const rejectedCount = properties.filter((p) => p.approval_status === 'Rejected').length;

    return {
      total: properties.length,
      pending: pendingCount,
      approved: approvedCount,
      published: publishedCount,
      rejected: rejectedCount,
      rent: properties.filter((p) => p.listing_type === 'Rent').length,
      resale: properties.filter((p) => p.listing_type === 'Re-sale').length,
      presales: properties.filter((p) => p.listing_type === 'Pre-sales').length,
    };
  }, [properties]);

  const categoriesList: { id: string; label: string; icon: any }[] = [
    { id: 'all', label: `All Categories`, icon: Layers },
    { id: 'Residential', label: 'Residential', icon: Home },
    { id: 'Commercial', label: 'Commercial', icon: Briefcase },
    { id: 'Industrial', label: 'Industrial', icon: Factory },
    { id: 'Land & Plot', label: 'Land & Plot', icon: Trees },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1d1d1f] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in slide-in-from-bottom-4 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Main Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Listing Operations & Approval Desk
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Operations Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central handling department: Review and approve Pre-sales, Rent, and Re-sale properties before publishing to the public showcase.
          </p>
        </div>

        {/* Header Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Sync Database Submissions Button */}
          <button
            onClick={handleSyncDatabase}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            title="Scan database for new submissions from PropConnect or Pre-Sales"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          {/* Preview Public Landing Page Button */}
          <button
            onClick={() => setIsLandingPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Preview how properties appear to the public on the landing page"
          >
            <Eye className="w-3.5 h-3.5 text-amber-600" />
            <span>Showcase Preview</span>
          </button>

          {/* Add Pre-sales Property Button (TOP RIGHT as requested) */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1d1d1f] hover:bg-black active:scale-95 transition-all shadow-apple-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Pre-sales property</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Properties in Database */}
        <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total in Database</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pre-sales, Rent & Re-sale</div>
        </div>

        {/* Needs Approval - HIGHLIGHTED IN AMBER */}
        <button
          onClick={() => setApprovalFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            approvalFilter === 'pending'
              ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/20 shadow-xs'
              : 'border-amber-200 bg-amber-50/20 hover:border-amber-300 hover:bg-amber-50/40 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Needs Approval</span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-xl font-black text-amber-900 mt-1 flex items-center gap-2">
            <span>{stats.pending}</span>
            {stats.pending > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200/80 text-amber-800">
                Action Required
              </span>
            )}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Pending Panel Review</div>
        </button>

        {/* Approved Properties */}
        <button
          onClick={() => setApprovalFilter('approved')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            approvalFilter === 'approved'
              ? 'border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-400/20 shadow-xs'
              : 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-xs'
          }`}
        >
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Approved Properties</div>
          <div className="text-xl font-black text-emerald-900 mt-1">{stats.approved}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Operations Verified</div>
        </button>

        {/* Live on Public Showcase */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 shadow-xs">
          <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Live on Showcase</div>
          <div className="text-xl font-black text-indigo-900 mt-1 flex items-center gap-2">
            <span>{stats.published}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800">
              Showcase Active
            </span>
          </div>
          <div className="text-[11px] text-indigo-600 mt-0.5">Toggled ON for Public</div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* APPROVAL WORKFLOW STATUS TABS */}
      {/* ==================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-slate-100/80 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 shrink-0">
            Approval Queue:
          </span>
          {[
            { id: 'all', label: 'All Properties', count: stats.total },
            { id: 'pending', label: 'Needs Approval', count: stats.pending, highlight: stats.pending > 0 },
            { id: 'approved', label: 'Approved', count: stats.approved },
            { id: 'rejected', label: 'Rejected', count: stats.rejected },
          ].map((tab) => {
            const isActive = approvalFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setApprovalFilter(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    tab.highlight
                      ? 'bg-amber-500 text-white'
                      : isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Transaction Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 shrink-0">
            Type:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'Pre-sales', label: '🏢 Pre-sales' },
            { id: 'Rent', label: '🔑 Rent' },
            { id: 'Re-sale', label: '🏷️ Re-sale' },
          ].map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Sub-Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Category:
            </span>
            {categoriesList.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Visibility Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, location, code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="all">All Visibility</option>
              <option value="published">Showcase ON</option>
              <option value="unpublished">Showcase OFF</option>
            </select>
          </div>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold">Loading database inventory & submissions...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No properties found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {approvalFilter === 'pending'
              ? 'Great job! There are currently no pending properties waiting for approval.'
              : 'No properties match the selected filters. Use "Add Pre-sales property" or sync submissions from the database.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={handleSyncDatabase}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Sync Database
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1d1d1f] hover:bg-black text-white transition-all cursor-pointer"
            >
              Add Pre-sales Property
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((property) => {
            const isApproved = property.is_approved === true || property.approval_status === 'Approved';
            const isRejected = property.approval_status === 'Rejected';
            const isPending = !isApproved && !isRejected;

            return (
              <div
                key={property.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-300/40'
                    : isRejected
                    ? 'border-rose-200 bg-rose-50/10'
                    : 'border-black/[0.08]'
                }`}
              >
                {/* Property Card Header & Image */}
                <div className="relative aspect-16/10 bg-slate-100 overflow-hidden group select-none">
                  <img
                    src={
                      property.images?.[0] ||
                      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80'
                    }
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Top Badges: Type & Approval Status */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-[#1d1d1f] text-white shadow-xs">
                        {property.listing_type}
                      </span>
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
                        {property.property_category}
                      </span>
                    </div>

                    {/* Approval Status Badge */}
                    <div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500 text-white shadow-xs animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Image Info: Price & Area */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <div className="text-lg font-black tracking-tight drop-shadow-md">
                        {property.price_display || `₹ ${property.price.toLocaleString('en-IN')}`}
                      </div>
                      <div className="text-[11px] text-white/90 drop-shadow-xs font-medium">
                        {property.area} sq.ft {property.bhk ? `• ${property.bhk}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {property.videos && property.videos.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-purple-600/90 backdrop-blur-md text-white border border-purple-400/30 flex items-center gap-1">
                          <VideoIcon className="w-2.5 h-2.5" />
                          <span>{property.videos.length} videos</span>
                        </span>
                      )}
                      {property.images && property.images.length > 1 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                          {property.images.length} photos
                        </span>
                      )}
                      {property.source && (
                        <span className="text-[9px] px-2 py-0.5 rounded-md font-mono font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                          {property.source === 'presales_form' && 'Pre-Sales'}
                          {property.source === 'propconnect_rent' && 'Rent'}
                          {property.source === 'propconnect_resale' && 'Re-Sale'}
                          {property.source === 'panel_manual' && 'Manual'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Property Content Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1" title={property.title}>
                      {property.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{property.address || property.locality}, {property.city}</span>
                    </p>

                    {/* Developer or Owner Contact info */}
                    {(property.developer || property.owner_name) && (
                      <p className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-medium">
                          {property.developer ? `Developer: ${property.developer}` : `Owner: ${property.owner_name}`}
                        </span>
                        {(property.contact_phone || property.owner_phone) && (
                          <span className="font-mono text-slate-500 font-semibold text-[10px]">
                            • {property.contact_phone || property.owner_phone}
                          </span>
                        )}
                      </p>
                    )}

                    {property.registration_code && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        Ref Code: <span className="font-bold text-slate-700">{property.registration_code}</span>
                      </div>
                    )}
                  </div>

                  {/* ==================================================== */}
                  {/* APPROVAL ACTIONS OR PUBLISH TOGGLE */}
                  {/* ==================================================== */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {/* IF PENDING: Show Approve and Reject Actions */}
                    {isPending ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(property.id, true, property.title)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-apple-sm cursor-pointer"
                            title="Approve and immediately publish to the Public Showcase"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Publish</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApprove(property.id, false, property.title)}
                            className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                            title="Approve but keep unpublished for now"
                          >
                            <span>Approve Only</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReject(property.id, property.title)}
                            className="p-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 active:scale-95 transition-all cursor-pointer"
                            title="Reject this submission"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick View, Edit & Delete Actions for Pending */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-[11px] font-semibold text-amber-600">Pending Review</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedProperty(property)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                              title="Inspect Details & Media"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProperty(property)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                              title="Edit Property Details"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(property.id, property.title)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete from inventory"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* IF APPROVED OR REJECTED: Show Live Web Toggle and Actions */
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={property.is_published}
                            onClick={() => handleToggle(property.id, property.is_published, property.title, isApproved)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                              property.is_published ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                property.is_published ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-[11px] font-semibold text-slate-700 select-none">
                            {property.is_published ? (
                              <span className="text-emerald-700 font-bold">Live on Web</span>
                            ) : (
                              <span className="text-slate-400">Hidden from Web</span>
                            )}
                          </span>
                        </div>

                        {/* Quick View, Edit & Delete Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedProperty(property)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                            title="Inspect Details & Photos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProperty(property)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                            title="Edit Property Details"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(property.id, property.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Remove from inventory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Pre-sales Property Modal */}
      <AddPreSalesModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newProp) => {
          setProperties((prev) => [newProp, ...prev]);
          setActiveTab('Pre-sales');
          showToast(`✨ Pre-sales project "${newProp.title}" added to inventory!`);
        }}
      />

      {/* Public Landing Page Full Preview Modal */}
      {isLandingPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 animate-in fade-in duration-200">
          <PublicLandingPage
            properties={properties}
            onClose={() => setIsLandingPreviewOpen(false)}
          />
        </div>
      )}

      {/* Property Details Lightbox Review Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/[0.08] flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
                  {selectedProperty.listing_type}
                </span>
                <span className="text-xs font-bold text-slate-600">{selectedProperty.property_category}</span>
                {selectedProperty.approval_status && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedProperty.approval_status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedProperty.approval_status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}
                  >
                    {selectedProperty.approval_status}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-left">
              {/* Photo Gallery */}
              <div className="space-y-2">
                <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                  <img
                    src={
                      selectedProperty.images?.[inspectImageIdx] ||
                      selectedProperty.images?.[0] ||
                      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80'
                    }
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover transition-all duration-200"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-mono font-bold backdrop-blur-xs">
                    Photo {inspectImageIdx + 1} of {selectedProperty.images?.length || 1}
                  </div>
                </div>

                {/* Thumbnails row */}
                {selectedProperty.images && selectedProperty.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                    {selectedProperty.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setInspectImageIdx(i)}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          inspectImageIdx === i
                            ? 'border-purple-600 scale-105 shadow-apple-xs'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`thumb ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Walkthrough & Drone Tour Videos Section */}
              {selectedProperty.videos && selectedProperty.videos.length > 0 && (
                <div className="space-y-2.5 p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5 uppercase tracking-wider">
                      <VideoIcon className="w-4 h-4 text-purple-700" />
                      <span>Walkthrough & Drone Videos ({selectedProperty.videos.length})</span>
                    </h4>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      Verified Media
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProperty.videos.map((vidUrl, vIdx) => (
                      <div key={vIdx} className="space-y-1">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-xs border border-purple-200">
                          <video
                            src={vidUrl}
                            controls
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                        </div>
                        <p className="text-[10px] font-mono text-purple-900 truncate">
                          Video #{vIdx + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedProperty.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedProperty.address || selectedProperty.locality}, {selectedProperty.city}
                </p>
                <div className="text-xl font-black text-emerald-700 mt-2">
                  {selectedProperty.price_display || `₹ ${selectedProperty.price.toLocaleString('en-IN')}`}
                </div>
              </div>

              {/* Grid of Key Info */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Built-up Area</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedProperty.area} sq.ft</div>
                </div>
                {selectedProperty.bhk && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Configuration</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{selectedProperty.bhk}</div>
                  </div>
                )}
                {(selectedProperty.developer || selectedProperty.owner_name) && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      {selectedProperty.developer ? 'Developer' : 'Owner'}
                    </div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {selectedProperty.developer || selectedProperty.owner_name}
                    </div>
                  </div>
                )}
                {(selectedProperty.contact_phone || selectedProperty.owner_phone) && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Contact Number</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">
                      {selectedProperty.contact_phone || selectedProperty.owner_phone}
                    </div>
                  </div>
                )}
              </div>

              {selectedProperty.location_url && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Google Maps Link verified</span>
                  </div>
                  <a
                    href={selectedProperty.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    <span>Open Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedProperty.description}
                </p>
              </div>

              {selectedProperty.rera_number && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                  <span className="text-purple-800 font-semibold">Gujarat RERA Number: </span>
                  <span className="font-mono font-bold text-purple-900 break-all">{selectedProperty.rera_number}</span>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-black/[0.06] bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Approval controls if pending */}
              {selectedProperty.approval_status === 'Pending' || (!selectedProperty.is_approved && selectedProperty.approval_status !== 'Rejected') ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedProperty.id, true, selectedProperty.title)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-apple-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Show on Web</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedProperty.id, selectedProperty.title)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Live Showcase:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      selectedProperty.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedProperty.is_published ? 'ON' : 'OFF'}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const prop = selectedProperty;
                    setEditingProperty(prop);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 active:scale-95 transition-all cursor-pointer shadow-apple-sm"
                  title="Edit this listing"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedProperty.id, selectedProperty.title)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 active:scale-95 transition-all cursor-pointer shadow-apple-sm"
                  title="Delete from inventory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      <EditPropertyModal
        isOpen={!!editingProperty}
        property={editingProperty}
        onClose={() => setEditingProperty(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default ListingsPage;
