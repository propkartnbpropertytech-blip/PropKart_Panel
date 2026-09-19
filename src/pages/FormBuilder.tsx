import React, { useState, useEffect } from 'react';
import { FormSection, FormField, FormVersion } from '../types/panel';
import {
  fetchActiveFormSchema,
  fetchVersionSchema,
  saveVersionSchema,
  publishFormVersion,
  createNewDraftVersion,
} from '../services/api';
import { FieldEditorModal } from '../components/FieldEditorModal';
import { LiveFormPreview } from '../components/LiveFormPreview';
import {
  Plus,
  Save,
  Rocket,
  Eye,
  Trash2,
  Edit2,
  Copy,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderPlus,
  Sliders,
  Check,
} from 'lucide-react';

export const FormBuilder: React.FC = () => {
  const [formId, setFormId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('Instant Property Registration');
  const [version, setVersion] = useState<FormVersion | null>(null);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Field Editor Modal state
  const [editingField, setEditingField] = useState<{
    sectionIdx: number;
    fieldIdx?: number;
    field: FormField | null;
  } | null>(null);

  // Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // New Section Title state
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  // Load Form and current version schema
  useEffect(() => {
    async function loadActiveSchema() {
      setLoading(true);
      try {
        const activeData = await fetchActiveFormSchema();
        setFormId(activeData.id);
        setFormTitle(activeData.title);
        setVersion({
          id: activeData.version.id,
          form_id: activeData.id,
          version_number: activeData.version.version_number,
          status: 'published',
          published_at: activeData.version.published_at,
          created_at: new Date().toISOString(),
        });
        setSections(activeData.sections || []);
      } catch (err: any) {
        console.error('Failed to load schema:', err);
        setFeedback({ type: 'error', message: err.message || 'Failed to load form schema.' });
      } finally {
        setLoading(false);
      }
    }
    loadActiveSchema();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Section Handlers
  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSec: FormSection = {
      title: newSectionTitle.trim(),
      description: '',
      display_order: sections.length + 1,
      fields: [],
    };
    setSections([...sections, newSec]);
    setNewSectionTitle('');
    setIsAddingSection(false);
    showFeedback('success', `Section "${newSec.title}" added.`);
  };

  const handleRemoveSection = (sectionIdx: number) => {
    if (!confirm('Are you sure you want to delete this section and all its fields?')) return;
    setSections(sections.filter((_, idx) => idx !== sectionIdx));
    showFeedback('success', 'Section removed.');
  };

  const handleMoveSection = (sectionIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? sectionIdx - 1 : sectionIdx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const updated = [...sections];
    const temp = updated[sectionIdx];
    updated[sectionIdx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSections(updated);
  };

  // Field Handlers
  const handleSaveField = (savedField: FormField) => {
    if (!editingField) return;
    const { sectionIdx, fieldIdx } = editingField;
    const updatedSections = [...sections];
    const sec = updatedSections[sectionIdx];

    if (fieldIdx !== undefined) {
      // Edit existing field
      sec.fields[fieldIdx] = savedField;
    } else {
      // Add new field
      savedField.display_order = sec.fields.length + 1;
      sec.fields.push(savedField);
    }

    setSections(updatedSections);
    setEditingField(null);
    showFeedback('success', `Field "${savedField.label}" saved.`);
  };

  const handleRemoveField = (sectionIdx: number, fieldIdx: number) => {
    const updated = [...sections];
    updated[sectionIdx].fields = updated[sectionIdx].fields.filter((_, idx) => idx !== fieldIdx);
    setSections(updated);
    showFeedback('success', 'Field removed.');
  };

  const handleDuplicateField = (sectionIdx: number, fieldIdx: number) => {
    const updated = [...sections];
    const original = updated[sectionIdx].fields[fieldIdx];
    const clone: FormField = {
      ...JSON.parse(JSON.stringify(original)),
      id: undefined,
      label: `${original.label} (Copy)`,
      field_key: `${original.field_key}_copy_${Math.floor(Math.random() * 1000)}`,
      display_order: updated[sectionIdx].fields.length + 1,
    };
    updated[sectionIdx].fields.push(clone);
    setSections(updated);
    showFeedback('success', `Field "${clone.label}" duplicated.`);
  };

  const handleMoveField = (sectionIdx: number, fieldIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? fieldIdx - 1 : fieldIdx + 1;
    const sec = sections[sectionIdx];
    if (targetIdx < 0 || targetIdx >= sec.fields.length) return;
    const updated = [...sections];
    const temp = updated[sectionIdx].fields[fieldIdx];
    updated[sectionIdx].fields[fieldIdx] = updated[sectionIdx].fields[targetIdx];
    updated[sectionIdx].fields[targetIdx] = temp;
    setSections(updated);
  };

  // Save Schema to Backend
  const handleSaveDraft = async () => {
    if (!version) return;
    setSaving(true);
    try {
      // If current version is already published, prompt to create draft first
      if (version.status === 'published') {
        const draftVer = await createNewDraftVersion(
          formId,
          `Version ${version.version_number + 1} working draft`
        );
        setVersion(draftVer);
        await saveVersionSchema(draftVer.id, sections);
        showFeedback('success', `New Draft Version ${draftVer.version_number} created and saved.`);
      } else {
        await saveVersionSchema(version.id, sections);
        showFeedback('success', 'Draft schema saved successfully.');
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      showFeedback('error', err.message || 'Failed to save schema.');
    } finally {
      setSaving(false);
    }
  };

  // Publish Form Version
  const handlePublish = async () => {
    if (!version) return;
    if (!confirm(`Are you ready to publish Version ${version.version_number}? It will immediately become live on PropKart Connect.`)) {
      return;
    }

    setPublishing(true);
    try {
      // Save changes first if in draft
      if (version.status === 'draft') {
        await saveVersionSchema(version.id, sections);
      }
      const published = await publishFormVersion(version.id);
      setVersion(published);
      showFeedback('success', `Version ${published.version_number} is now LIVE on PropKart Connect!`);
    } catch (err: any) {
      console.error('Publish error:', err);
      showFeedback('error', err.message || 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  // Create explicit new draft
  const handleCreateDraft = async () => {
    if (!formId) return;
    setLoading(true);
    try {
      const draftVer = await createNewDraftVersion(formId, 'New version edit');
      setVersion(draftVer);
      showFeedback('success', `Created Draft Version ${draftVer.version_number}. You can now add/modify fields safely.`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create new draft version.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-semibold">Loading Form Builder Engine...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner / Actions Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold font-display text-white">{formTitle}</h2>
            {version && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  version.status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                Version {version.version_number} • {version.status}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build and organize sections, add custom fields, configure validation rules, and preview in real-time.
          </p>
        </div>

        {/* Builder Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-xs"
          >
            <Eye className="w-4 h-4 text-brand-400" />
            <span>Live Preview</span>
          </button>

          {version?.status === 'published' ? (
            <button
              onClick={handleCreateDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create Draft Version</span>
            </button>
          ) : (
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-brand-400" />}
              <span>Save Draft</span>
            </button>
          )}

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-950/30 transition-all disabled:opacity-50"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            <span>Publish to Connect</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sections and Fields Tree */}
      <div className="space-y-6">
        {sections.map((section, sIdx) => (
          <div
            key={section.id || sIdx}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-5"
          >
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center text-xs font-bold">
                  {sIdx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{section.title}</h3>
                  {section.description && (
                    <p className="text-[11px] text-slate-400">{section.description}</p>
                  )}
                </div>
              </div>

              {/* Section Controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => handleMoveSection(sIdx, 'up')}
                  disabled={sIdx === 0}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                  title="Move Section Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveSection(sIdx, 'down')}
                  disabled={sIdx === sections.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                  title="Move Section Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingField({ sectionIdx: sIdx, field: null })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600/20 text-brand-300 border border-brand-500/30 hover:bg-brand-600/30 text-xs font-semibold ml-2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
                <button
                  onClick={() => handleRemoveSection(sIdx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
                  title="Delete Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fields List */}
            {section.fields.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500 space-y-2">
                <div>No fields in this section yet.</div>
                <button
                  onClick={() => setEditingField({ sectionIdx: sIdx, field: null })}
                  className="text-brand-400 hover:underline font-semibold"
                >
                  + Add First Field
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.fields.map((f, fIdx) => (
                  <div
                    key={f.field_key || fIdx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all group"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">{f.label}</span>
                        {f.is_required && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                            Required
                          </span>
                        )}
                        {!f.is_active && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-500">{f.field_key}</span>
                        <span>•</span>
                        <span className="capitalize text-brand-400 font-medium">{f.field_type}</span>
                        {f.options && f.options.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{f.options.length} options</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Field Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveField(sIdx, fIdx, 'up')}
                        disabled={fIdx === 0}
                        className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveField(sIdx, fIdx, 'down')}
                        disabled={fIdx === section.fields.length - 1}
                        className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateField(sIdx, fIdx)}
                        className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors"
                        title="Duplicate Field"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingField({ sectionIdx: sIdx, fieldIdx: fIdx, field: f })}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        title="Edit Field"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveField(sIdx, fIdx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Add Section Button */}
        {isAddingSection ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-w-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">New Form Section</h4>
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="e.g. Additional Owner Requirements"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setIsAddingSection(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs"
              >
                Add Section
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingSection(true)}
            className="w-full py-4 rounded-3xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all"
          >
            <FolderPlus className="w-4 h-4 text-brand-400" />
            <span>Create New Form Section</span>
          </button>
        )}
      </div>

      {/* Field Editor Modal */}
      {editingField && (
        <FieldEditorModal
          field={editingField.field}
          isOpen={true}
          onClose={() => setEditingField(null)}
          onSave={handleSaveField}
        />
      )}

      {/* Live Preview Modal */}
      <LiveFormPreview
        sections={sections}
        formTitle={formTitle}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};
