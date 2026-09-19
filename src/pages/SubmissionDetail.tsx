import React, { useState, useEffect } from 'react';
import {
  SubmissionDetail as ISubmissionDetail,
  User,
} from '../types/panel';
import {
  fetchSubmissionDetail,
  updateSubmissionStatus,
  assignSubmission,
  addTelecallerNote,
  convertSubmissionToProperty,
  fetchTelecallers,
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
  Sparkles,
} from 'lucide-react';

interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
}

const STATUS_OPTIONS = [
  'New',
  'Contact Pending',
  'Contacted',
  'Details Verified',
  'In Progress',
  'Converted',
  'Not Interested',
  'Rejected',
  'Archived',
];

export const SubmissionDetail: React.FC<SubmissionDetailProps> = ({
  submissionId,
  onBack,
}) => {
  const [data, setData] = useState<ISubmissionDetail | null>(null);
  const [telecallers, setTelecallers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [noteStatus, setNoteStatus] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [converting, setConverting] = useState(false);
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
      const [detail, telecallersList] = await Promise.all([
        fetchSubmissionDetail(submissionId),
        fetchTelecallers().catch(() => []),
      ]);
      setData(detail);
      setTelecallers(telecallersList);
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
      showToast(`Status updated to "${newStatus}".`);
      loadDetail();
    } catch (e: any) {
      showToast(e.message || 'Status update failed');
    }
  };

  const handleAssignTelecaller = async (userId: string | null) => {
    try {
      await assignSubmission(submissionId, userId);
      showToast('Assigned telecaller updated.');
      loadDetail();
    } catch (e: any) {
      showToast(e.message || 'Assignment failed');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      await addTelecallerNote(submissionId, newNote.trim(), noteStatus || undefined);
      setNewNote('');
      setNoteStatus('');
      showToast('Call log note recorded.');
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

  const handleConvertToProperty = async () => {
    if (!confirm('Convert this verified submission into an active property in PropKart inventory?')) {
      return;
    }
    setConverting(true);
    try {
      await convertSubmissionToProperty(submissionId);
      showToast('🎉 Property successfully created in PropKart Inventory!');
      loadDetail();
    } catch (e: any) {
      showToast(e.message || 'Conversion failed');
    } finally {
      setConverting(false);
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
        <span className="text-xs font-semibold">Loading submission dossier...</span>
      </div>
    );
  }

  const { submission, schema, media, notes, audit_logs } = data;
  const raw = submission.raw_data || {};

  return (
    <div className="p-6 space-y-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
            title="Back to submissions"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold font-mono text-brand-600">
                {submission.registration_code}
              </span>
              <button
                onClick={() => handleCopy(submission.registration_code, 'Reference ID')}
                className="p-1 text-slate-400 hover:text-slate-700"
                title="Copy ID"
              >
                {copiedKey === 'Reference ID' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <span className="text-xs text-slate-500">• Version {schema?.version?.version_number || 1}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Submitted by <strong className="text-slate-900">{submission.owner_name}</strong></span>
              <span>•</span>
              <span className="text-[11px]">{new Date(submission.created_at).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* WhatsApp CTA */}
          {submission.owner_phone && (
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Owner</span>
            </button>
          )}

          {/* Call CTA */}
          {submission.owner_phone && (
            <a
              href={`tel:${submission.owner_phone}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-brand-600" />
              <span>Call +91 {submission.owner_phone}</span>
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

          {/* Convert to Inventory CTA */}
          <button
            onClick={handleConvertToProperty}
            disabled={converting || submission.status === 'Converted'}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
              submission.status === 'Converted'
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/20'
            }`}
          >
            {converting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{submission.status === 'Converted' ? 'Already in Inventory' : 'Convert to Property'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Details Left, Operations Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Structured Dynamic Details & Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* Telecaller Quick Assignment & Workflow Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Workflow Status & Assignment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Current Lead Status</label>
                <select
                  value={submission.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:border-brand-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Assigned Telecaller</label>
                <select
                  value={submission.assigned_to || ''}
                  onChange={(e) => handleAssignTelecaller(e.target.value ? e.target.value : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Unassigned</option>
                  {telecallers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.role})
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
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{sec.title}</h3>
                  {sec.description && <p className="text-[11px] text-slate-500">{sec.description}</p>}
                </div>
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
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-slate-900 font-mono truncate max-w-md">
                            {locUrl || 'No Google location link provided'}
                          </div>
                          {locUrl && (
                            <div className="flex items-center gap-2">
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
                                <span>Open Google Maps</span>
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
                        <span>{f.label}</span>
                        {val && (
                          <button
                            onClick={() => handleCopy(String(val), f.label)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
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

          {/* Media Section (Lightbox & Video Player) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <MediaGalleryViewer media={media} />
          </div>
        </div>

        {/* Right 1 Column: Telecaller Call Logs & Audit Trail */}
        <div className="space-y-6">
          {/* Add Telecaller Log Note */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-600" />
              <span>Log Telecaller Activity</span>
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Call Status Outcome</label>
                <select
                  value={noteStatus}
                  onChange={(e) => setNoteStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Select Call Outcome</option>
                  <option value="Connected - Interested">Connected - Interested</option>
                  <option value="Connected - Price Negotiation">Connected - Price Negotiation</option>
                  <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                  <option value="Call Back Requested">Call Back Requested</option>
                  <option value="Ringing / No Answer">Ringing / No Answer</option>
                  <option value="Switched Off">Switched Off</option>
                  <option value="Not Interested">Not Interested</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Call Notes / Discussion</label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record key details: owner availability, price flexibility, documents verified..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs leading-relaxed focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
              >
                {submittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Save Telecaller Note</span>
              </button>
            </form>

            {/* Notes Timeline */}
            <div className="pt-3 border-t border-slate-200 space-y-3 max-h-80 overflow-y-auto">
              {notes.length === 0 ? (
                <div className="text-[11px] text-slate-400 text-center py-4">
                  No telecaller logs recorded yet.
                </div>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-brand-600">
                        {n.user?.full_name || 'Telecaller'}
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
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Audit Trail
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
