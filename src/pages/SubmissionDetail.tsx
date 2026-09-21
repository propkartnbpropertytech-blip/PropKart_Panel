import React, { useState, useEffect } from 'react';
import {
  SubmissionDetail as ISubmissionDetail,
} from '../types/panel';
import {
  fetchSubmissionDetail,
  updateSubmissionStatus,
  addTelecallerNote,
  updateSubmissionData,
  deleteSubmission,
  downloadExportZip,
  downloadExportCsv,
} from '../services/api';
import { MediaGalleryViewer } from '../components/MediaGalleryViewer';
import { WhatsAppModal } from '../components/WhatsAppModal';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Compass,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Building,
  Calendar,
  Clock,
  User as UserIcon,
  ShieldCheck,
  Send,
  Loader2,
  ExternalLink,
  Edit3,
  Save,
  CheckCircle2,
  FileText,
  Tag,
  Trash2,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  Archive,
} from 'lucide-react';

interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
}

const PROPERTY_STATUS_OPTIONS = [
  'New',
  'Under Review',
  'Details Verified',
  'Active Listing',
  'Under Discussion',
  'Reserved',
  'Closed / Sold',
  'Archived',
  'Rejected',
];

const NOTE_CATEGORIES = [
  'Property Verification',
  'Owner Discussion',
  'Pricing & Valuation',
  'Documentation Check',
  'Site Inspection',
  'General Remark',
];

export const SubmissionDetail: React.FC<SubmissionDetailProps> = ({
  submissionId,
  onBack,
}) => {
  const [data, setData] = useState<ISubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isEditingData, setIsEditingData] = useState(false);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadDetail = async () => {
    setLoading(true);
    try {
      const detail = await fetchSubmissionDetail(submissionId);
      setData(detail);
      setEditFormData(detail.submission.raw_data || {});
    } catch (err) {
      console.error('Failed to load submission detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [submissionId]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${key} to clipboard.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!data || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateSubmissionStatus(submissionId, newStatus);
      showToast(`Property status updated to "${newStatus}".`);
      await loadDetail();
    } catch (e: any) {
      showToast(e.message || 'Status update failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSubmission(submissionId);
      showToast('Property entry deleted permanently.');
      setIsDeleteModalOpen(false);
      onBack();
    } catch (e: any) {
      showToast(e.message || 'Failed to delete entry');
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async (singleOnly = true) => {
    setIsExportingCsv(true);
    setIsExportMenuOpen(false);
    try {
      const ids = singleOnly ? [submissionId] : undefined;
      await downloadExportCsv(ids);
      showToast(
        singleOnly
          ? `CSV data for ${data?.submission.registration_code || 'property'} downloaded.`
          : 'Complete CSV property pool report downloaded.'
      );
    } catch (e: any) {
      showToast(e.message || 'Failed to download CSV export');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportZip = async (singleOnly = true) => {
    setIsExportingZip(true);
    setIsExportMenuOpen(false);
    try {
      const ids = singleOnly ? [submissionId] : undefined;
      await downloadExportZip(ids);
      showToast(
        singleOnly
          ? `ZIP package with photos for ${data?.submission.registration_code || 'property'} downloaded.`
          : 'Complete ZIP package with all pool photos downloaded.'
      );
    } catch (e: any) {
      showToast(e.message || 'Failed to download ZIP export');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      await addTelecallerNote(submissionId, newNote.trim(), noteCategory || undefined);
      setNewNote('');
      setNoteCategory('');
      showToast('Internal note added to property history.');
      loadDetail();
    } catch (e: any) {
      showToast(e.message || 'Failed to save note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleSaveDynamicData = async () => {
    try {
      await updateSubmissionData(submissionId, editFormData);
      setIsEditingData(false);
      showToast('Property details updated successfully.');
      loadDetail();
    } catch (e: any) {
      showToast(e.message || 'Update failed');
    }
  };

  const handleShareSummary = () => {
    if (!data) return;
    const sub = data.submission;
    const raw = sub.raw_data || {};
    const summary = `🏡 PropKart Property Listing (${sub.registration_code})
• Type: ${sub.property_type || 'Residential'} (${sub.listing_type || 'Sale'})
• Location: ${sub.address || sub.area || ''}, ${sub.city || ''}
• Expected Price: ₹${raw.expected_price ? Number(raw.expected_price).toLocaleString('en-IN') : 'N/A'}
• Built-up Area: ${raw.built_up_area || 'N/A'} sq. ft (${raw.bhk || ''})
• Owner: ${sub.owner_name} (+91 ${sub.owner_phone})
• Maps: ${sub.location_url || 'N/A'}`;

    handleCopy(summary, 'Property Summary');
  };

  if (loading || !data) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-semibold">Loading property dossier...</span>
      </div>
    );
  }

  const { submission, schema, media, notes, audit_logs } = data;
  const raw = submission.raw_data || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-[#1d1d1f] text-white text-xs font-medium shadow-apple-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-5 sm:p-6 shadow-apple-sm">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] flex items-center justify-center transition-all active:scale-[0.98] shrink-0 cursor-pointer"
            title="Back to property pool"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xl font-bold font-mono tracking-tight text-[#1d1d1f]">
                {submission.registration_code}
              </span>
              <button
                onClick={() => handleCopy(submission.registration_code, 'Reference ID')}
                className="p-1 text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
                title="Copy ID"
              >
                {copiedKey === 'Reference ID' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.06]">
                Property Pool
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#86868b] mt-1">
              <span>Owner: <strong className="text-[#1d1d1f]">{submission.owner_name}</strong></span>
              <span>•</span>
              <span className="text-[11px]">{new Date(submission.created_at).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp CTA */}
          {submission.owner_phone && (
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          )}

          {/* Call CTA */}
          {submission.owner_phone && (
            <a
              href={`tel:${submission.owner_phone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.08] text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-[#1d1d1f]" />
              <span>Call</span>
            </a>
          )}

          {/* Share CTA */}
          <button
            onClick={handleShareSummary}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.08] text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
            title="Copy formatted summary"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Dual Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.08] text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
              title="Export submission data"
            >
              {isExportingCsv || isExportingZip ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1d1d1f]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#1d1d1f]" />
              )}
              <span>Export</span>
            </button>

            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-2xl shadow-apple-lg p-2 z-30 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
                    This Property ({submission.registration_code})
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExportCsv(true)}
                    disabled={isExportingCsv}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f5f5f7] text-left text-xs text-[#1d1d1f] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#1d1d1f]">Export CSV</div>
                      <div className="text-[10px] text-[#86868b]">Spreadsheet data</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportZip(true)}
                    disabled={isExportingZip}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f5f5f7] text-left text-xs text-[#1d1d1f] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Archive className="w-4 h-4 text-[#1d1d1f] shrink-0" />
                    <div>
                      <div className="font-semibold text-[#1d1d1f]">Export ZIP</div>
                      <div className="text-[10px] text-[#86868b]">Data + all {media?.length || 0} photos</div>
                    </div>
                  </button>

                  <div className="border-t border-black/[0.06] my-1" />

                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                    All Properties
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExportCsv(false)}
                    disabled={isExportingCsv}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-[#f5f5f7] text-left text-xs text-[#1d1d1f] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                    <span className="text-[11px]">Export All (CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportZip(false)}
                    disabled={isExportingZip}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-[#f5f5f7] text-left text-xs text-[#1d1d1f] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Archive className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                    <span className="text-[11px]">Export All (ZIP)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Delete Entry CTA */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-200/60 text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
            title="Delete this property registration"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Details Left, Operations Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Structured Dynamic Details & Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Pool Status Selector Card with Interactive Toggle Buttons */}
          <div className="bg-white border border-black/[0.06] rounded-3xl p-5 sm:p-6 shadow-apple-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
                    Status
                  </h3>
                  {isUpdatingStatus && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#1d1d1f] font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Updating...
                    </span>
                  )}
                </div>
              </div>
              <div className="sm:w-56">
                <select
                  value={submission.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdatingStatus}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-xs font-semibold focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all outline-none cursor-pointer"
                >
                  {PROPERTY_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Quick Toggle Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-black/[0.04]">
              {PROPERTY_STATUS_OPTIONS.map((opt) => {
                const isActive = submission.status === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleStatusChange(opt)}
                    disabled={isUpdatingStatus}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#1d1d1f] text-white shadow-apple-sm'
                        : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] active:scale-[0.98]'
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC SUBMISSION RENDERING BY SCHEMA SECTIONS */}
          {schema?.sections?.map((sec) => (
            <div
              key={sec.id || sec.title}
              className="bg-white border border-black/[0.06] rounded-3xl p-5 sm:p-6 shadow-apple-sm space-y-4"
            >
              <div className="border-b border-black/[0.06] pb-3">
                <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight">{sec.title}</h3>
                {sec.description && <p className="text-[11px] text-[#86868b]">{sec.description}</p>}
              </div>

              {/* Dynamic Field Values Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {sec.fields.map((f) => {
                  const val = raw[f.field_key];

                  // Handle media fields separately
                  if (['photos', 'videos'].includes(f.field_type)) {
                    return null;
                  }

                  // Handle Google Location
                  if (f.field_type === 'google_location') {
                    const locUrl = typeof val === 'object' ? (val.url || val.location_url) : val;
                    const isValidMaps = locUrl && /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(locUrl).trim());
                    return (
                      <div key={f.field_key} className="md:col-span-2 p-4 rounded-2xl bg-[#f5f5f7]/80 border border-black/[0.04] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
                            {f.label}
                          </div>
                          {locUrl && !isValidMaps && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Non-Google Maps Link</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs text-[#1d1d1f] font-mono break-all leading-relaxed">
                            {locUrl || 'No Google location link provided'}
                          </div>
                          {locUrl && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleCopy(locUrl, 'Location URL')}
                                className="p-2 rounded-full bg-white border border-black/[0.08] hover:bg-[#f5f5f7] text-[#1d1d1f] shadow-apple-sm transition-all"
                                title="Copy Link"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {isValidMaps ? (
                                <a
                                  href={locUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>Open Maps</span>
                                </a>
                              ) : (
                                <a
                                  href={locUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all"
                                  title="Open External Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Open Link</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Handle Direction
                  if (f.field_type === 'direction') {
                    const isLink = String(val).startsWith('http');
                    return (
                      <div key={f.field_key} className="md:col-span-2 p-4 rounded-2xl bg-[#f5f5f7]/80 border border-black/[0.04] space-y-1">
                        <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
                          {f.label}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-[#1d1d1f] leading-relaxed break-words">{val || 'N/A'}</span>
                          {isLink && (
                            <a
                              href={String(val)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-[#1d1d1f] hover:bg-[#f5f5f7] text-xs font-semibold shrink-0 shadow-apple-sm"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>Navigate</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Handle Multi-select badges
                  if (f.field_type === 'multiselect') {
                    const items: string[] = Array.isArray(val) ? val : [];
                    return (
                      <div key={f.field_key} className="md:col-span-2 space-y-1.5">
                        <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
                          {f.label}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.length === 0 ? (
                            <span className="text-xs text-[#86868b]">None selected</span>
                          ) : (
                            items.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full bg-[#f5f5f7] border border-black/[0.06] text-[#1d1d1f] text-xs font-medium"
                              >
                                {item}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Regular Text / Number / Phone / Currency fields
                  const isAddressOrLong =
                    f.field_type === 'textarea' ||
                    f.field_key.toLowerCase().includes('address') ||
                    f.label.toLowerCase().includes('address') ||
                    f.field_key.toLowerCase().includes('landmark') ||
                    f.field_key.toLowerCase().includes('direction') ||
                    (val && String(val).length > 40);

                  // Clean leading/trailing quotes if present from JSON
                  const cleanVal = val !== undefined && val !== null
                    ? String(val).replace(/^"+|"+$/g, '').trim()
                    : '';

                  return (
                    <div
                      key={f.field_key}
                      className={`p-4 rounded-2xl bg-[#f5f5f7]/80 border border-black/[0.04] space-y-1.5 ${
                        isAddressOrLong ? 'md:col-span-2' : ''
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider flex items-center justify-between">
                        <span className="truncate">{f.label}</span>
                        {cleanVal && (
                          <button
                            onClick={() => handleCopy(cleanVal, f.label)}
                            className="text-[#86868b] hover:text-[#1d1d1f] p-0.5 shrink-0 transition-colors cursor-pointer"
                            title={`Copy ${f.label}`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div
                        className={`text-xs font-semibold text-[#1d1d1f] ${
                          isAddressOrLong ? 'break-words whitespace-pre-wrap leading-relaxed' : 'break-words'
                        }`}
                      >
                        {f.field_type === 'currency' && val
                          ? `₹ ${Number(val).toLocaleString('en-IN')}`
                          : f.field_type === 'area' && val
                          ? `${val} sq. ft`
                          : cleanVal || '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Render all submitted dynamic fields from raw_data */}
          {(() => {
            const renderedKeys = new Set(
              schema?.sections?.flatMap((s) => s.fields.map((f) => f.field_key)) || []
            );
            const remainingKeys = Object.keys(raw).filter(
              (k) => !renderedKeys.has(k) && !['photos', 'videos'].includes(k)
            );

            if (remainingKeys.length === 0) return null;

            return (
              <div className="bg-white border border-black/[0.06] rounded-3xl p-5 sm:p-6 shadow-apple-sm space-y-4">
                <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {remainingKeys.map((k) => {
                    const rawVal = raw[k];
                    const cleanStr = typeof rawVal === 'object'
                      ? JSON.stringify(rawVal)
                      : String(rawVal || '').replace(/^"+|"+$/g, '').trim();
                    const isLong = cleanStr.length > 40 || k.toLowerCase().includes('address');
                    return (
                      <div
                        key={k}
                        className={`p-4 rounded-2xl bg-[#f5f5f7]/80 border border-black/[0.04] space-y-1.5 ${
                          isLong ? 'md:col-span-2' : ''
                        }`}
                      >
                        <div className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">
                          {k.replace(/_/g, ' ')}
                        </div>
                        <div
                          className={`text-xs font-semibold text-[#1d1d1f] ${
                            isLong ? 'break-words whitespace-pre-wrap leading-relaxed' : 'break-words'
                          }`}
                        >
                          {cleanStr || '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Media Section (Lightbox & Video Player) */}
          <div className="bg-white border border-black/[0.06] rounded-3xl p-5 sm:p-6 shadow-apple-sm">
            <MediaGalleryViewer media={media} />
          </div>
        </div>

        {/* Right 1 Column: Property Notes & Audit Trail */}
        <div className="space-y-6">
          {/* Property Team Notes */}
          <div className="bg-white border border-black/[0.06] rounded-3xl p-5 sm:p-6 shadow-apple-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1d1d1f]" />
              <span>Notes</span>
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">Category</label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-xs font-medium focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 outline-none transition-all cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {NOTE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">Observation</label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add note..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-xs leading-relaxed focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="w-full py-2.5 rounded-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs font-semibold shadow-apple-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all cursor-pointer"
              >
                {submittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Add Note</span>
              </button>
            </form>

            {/* Notes Timeline */}
            <div className="pt-3 border-t border-black/[0.04] space-y-2.5 max-h-80 overflow-y-auto">
              {notes.length === 0 ? (
                <div className="text-[11px] text-[#86868b] text-center py-4">
                  No notes recorded yet.
                </div>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-2xl bg-[#f5f5f7]/80 border border-black/[0.04] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[#1d1d1f]">
                        {n.user?.full_name || 'Admin'}
                      </span>
                      <span className="text-[#86868b]">
                        {new Date(n.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {n.call_status && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-black/[0.06] text-[#1d1d1f]">
                        {n.call_status}
                      </span>
                    )}
                    <p className="text-xs text-[#1d1d1f] leading-relaxed">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit History Card */}
          <div className="bg-white border border-black/[0.06] rounded-3xl p-5 sm:p-6 shadow-apple-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
              Audit Log
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {audit_logs.map((log) => (
                <div key={log.id} className="text-[11px] text-[#86868b] flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1d1d1f] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-[#1d1d1f] capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-[#86868b] ml-1.5">
                      {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-black/[0.08] p-6 shadow-apple-lg space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#1d1d1f]">
                Delete Property Entry?
              </h3>
              <p className="text-xs text-[#86868b]">
                Are you sure you want to delete registration{' '}
                <strong className="text-[#1d1d1f] font-mono">{submission.registration_code}</strong>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/[0.08] text-[#1d1d1f] text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {isWhatsAppOpen && (
        <WhatsAppModal
          submission={submission}
          isOpen={true}
          onClose={() => setIsWhatsAppOpen(false)}
        />
      )}
    </div>
  );
};
