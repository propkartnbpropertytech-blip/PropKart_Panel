import React, { useState, useEffect } from 'react';
import {
  SubmissionDetail as ISubmissionDetail,
} from '../types/panel';
import {
  fetchSubmissionDetail,
  updateSubmissionStatus,
  addTelecallerNote,
  updateSubmissionData,
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
    if (!data) return;
    try {
      await updateSubmissionStatus(submissionId, newStatus);
      showToast(`Property status updated to "${newStatus}".`);
      loadDetail();
    } catch (e: any) {
      showToast(e.message || 'Status update failed');
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
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors shrink-0"
            title="Back to property pool"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl font-bold font-mono text-brand-600">
                {submission.registration_code}
              </span>
              <button
                onClick={() => handleCopy(submission.registration_code, 'Reference ID')}
                className="p-1 text-slate-400 hover:text-slate-700"
                title="Copy ID"
              >
                {copiedKey === 'Reference ID' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                Property Pool
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Owner: <strong className="text-slate-900">{submission.owner_name}</strong></span>
              <span>•</span>
              <span className="text-[11px]">{new Date(submission.created_at).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* WhatsApp CTA */}
          {submission.owner_phone && (
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          )}

          {/* Call CTA */}
          {submission.owner_phone && (
            <a
              href={`tel:${submission.owner_phone}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-brand-600" />
              <span>Call Owner</span>
            </a>
          )}

          {/* Share CTA */}
          <button
            onClick={handleShareSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
            title="Copy formatted summary"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Details Left, Operations Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Structured Dynamic Details & Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Pool Status Selector Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Property Pool Lifecycle Status
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update listing status directly in the database pool
                </p>
              </div>
              <div className="sm:w-64">
                <select
                  value={submission.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:border-brand-500 transition-colors"
                >
                  {PROPERTY_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DYNAMIC SUBMISSION RENDERING BY SCHEMA SECTIONS */}
          {schema?.sections?.map((sec) => (
            <div
              key={sec.id || sec.title}
              className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5"
            >
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{sec.title}</h3>
                {sec.description && <p className="text-[11px] text-slate-500">{sec.description}</p>}
              </div>

              {/* Dynamic Field Values Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sec.fields.map((f) => {
                  const val = raw[f.field_key];

                  // Handle media fields separately
                  if (['photos', 'videos'].includes(f.field_type)) {
                    return null;
                  }

                  // Handle Google Location
                  if (f.field_type === 'google_location') {
                    const locUrl = typeof val === 'object' ? (val.url || val.location_url) : val;
                    return (
                      <div key={f.field_key} className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {f.label}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs text-slate-900 font-mono truncate max-w-md">
                            {locUrl || 'No Google location link provided'}
                          </div>
                          {locUrl && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleCopy(locUrl, 'Location URL')}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                                title="Copy Link"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={locUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Open Maps</span>
                              </a>
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
                      <div key={f.field_key} className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {f.label}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-900 leading-relaxed">{val || 'N/A'}</span>
                          {isLink && (
                            <a
                              href={String(val)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-brand-600 hover:text-brand-700 text-xs font-semibold shrink-0"
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
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {f.label}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.length === 0 ? (
                            <span className="text-xs text-slate-400">None selected</span>
                          ) : (
                            items.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium"
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
                  return (
                    <div
                      key={f.field_key}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1"
                    >
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
                        <span className="truncate">{f.label}</span>
                        {val && (
                          <button
                            onClick={() => handleCopy(String(val), f.label)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0"
                            title={`Copy ${f.label}`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {f.field_type === 'currency' && val
                          ? `₹ ${Number(val).toLocaleString('en-IN')}`
                          : f.field_type === 'area' && val
                          ? `${val} sq. ft`
                          : String(val || '—')}
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
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Additional Submitted Fields</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {remainingKeys.map((k) => (
                    <div key={k} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">
                        {k.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {typeof raw[k] === 'object' ? JSON.stringify(raw[k]) : String(raw[k] || '—')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Media Section (Lightbox & Video Player) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <MediaGalleryViewer media={media} />
          </div>
        </div>

        {/* Right 1 Column: Property Notes & Audit Trail */}
        <div className="space-y-6">
          {/* Property Team Notes */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Property Pool Notes</span>
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Note Category</label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Select Category</option>
                  {NOTE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Observation / Remark</label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record property observations, verified details, owner discussion notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs leading-relaxed focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {submittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Add Property Note</span>
              </button>
            </form>

            {/* Notes Timeline */}
            <div className="pt-3 border-t border-slate-200 space-y-3 max-h-80 overflow-y-auto">
              {notes.length === 0 ? (
                <div className="text-[11px] text-slate-400 text-center py-4">
                  No property notes recorded yet.
                </div>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-brand-600">
                        {n.user?.full_name || 'Admin'}
                      </span>
                      <span className="text-slate-400">
                        {new Date(n.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {n.call_status && (
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                        {n.call_status}
                      </span>
                    )}
                    <p className="text-xs text-slate-700 leading-relaxed">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit History Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Audit History
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {audit_logs.map((log) => (
                <div key={log.id} className="text-[11px] text-slate-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-800 capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
