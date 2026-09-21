import React, { useState, useEffect } from 'react';
import { fetchActiveFormSchema, saveActiveFormFieldsDirect } from '../services/api';
import {
  Plus,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  RotateCcw,
} from 'lucide-react';

export interface SimpleField {
  id?: string;
  field_key?: string;
  label: string;
  field_type: string;
  is_required: boolean;
  options?: { label: string; value: string }[] | string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Field' },
  { value: 'number', label: 'Number Field' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'email', label: 'Email Address' },
  { value: 'textarea', label: 'Address / Long Text' },
  { value: 'photos', label: 'Photos (Limit 50)' },
  { value: 'videos', label: 'Videos (Limit 30)' },
  { value: 'google_location', label: 'Google Maps Location' },
  { value: 'direction', label: 'Direction & Landmarks' },
  { value: 'dropdown', label: 'Dropdown Options' },
  { value: 'consent', label: 'Yes/No Checkbox' },
];

const DEFAULT_FIELDS: SimpleField[] = [
  { label: 'Owner Name', field_type: 'text', is_required: true },
  { label: 'Mobile Number', field_type: 'phone', is_required: true },
  { label: 'Email Address', field_type: 'email', is_required: false },
  {
    label: 'Property Type',
    field_type: 'dropdown',
    is_required: true,
    options: [
      { label: 'Residential Apartment', value: 'Residential Apartment' },
      { label: 'Villa / Bungalow', value: 'Villa / Bungalow' },
      { label: 'Commercial Office', value: 'Commercial Office' },
      { label: 'Plot / Land', value: 'Plot / Land' },
    ],
  },
  {
    label: 'Listing Type',
    field_type: 'dropdown',
    is_required: true,
    options: [
      { label: 'Rent', value: 'Rent' },
      { label: 'Re-sale', value: 'Re-sale' },
    ],
  },
  {
    label: 'Configuration (BHK)',
    field_type: 'dropdown',
    is_required: true,
    options: [
      { label: '1 BHK', value: '1 BHK' },
      { label: '2 BHK', value: '2 BHK' },
      { label: '3 BHK', value: '3 BHK' },
      { label: '4+ BHK', value: '4+ BHK' },
    ],
  },
  { label: 'Expected Price (₹)', field_type: 'number', is_required: true },
  { label: 'Built-up Area (Sq. Ft)', field_type: 'number', is_required: true },
  { label: 'City', field_type: 'text', is_required: true },
  { label: 'Locality / Area', field_type: 'text', is_required: true },
  { label: 'Address / Society Name', field_type: 'textarea', is_required: true },
  { label: 'Google Maps Location URL', field_type: 'google_location', is_required: true },
  { label: 'Direction & Landmarks', field_type: 'direction', is_required: true },
  { label: 'Property Photos (Limit 50)', field_type: 'photos', is_required: true },
  { label: 'Property Videos (Limit 30)', field_type: 'videos', is_required: false },
  { label: 'Owner Declaration & Consent', field_type: 'consent', is_required: true },
];

export const FormBuilder: React.FC = () => {
  const [fields, setFields] = useState<SimpleField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load active form fields
  useEffect(() => {
    async function loadFields() {
      setLoading(true);
      try {
        const activeData = await fetchActiveFormSchema();
        const extracted: SimpleField[] = [];
        (activeData.sections || []).forEach((sec: any) => {
          (sec.fields || []).forEach((f: any) => {
            extracted.push({
              id: f.id,
              field_key: f.field_key,
              label: f.label || '',
              field_type: f.field_type || 'text',
              is_required: !!f.is_required,
              options: f.options || [],
            });
          });
        });

        if (extracted.length > 0) {
          setFields(extracted);
        } else {
          setFields(DEFAULT_FIELDS);
        }
      } catch (err: any) {
        console.error('Failed to load fields:', err);
        setFields(DEFAULT_FIELDS);
      } finally {
        setLoading(false);
      }
    }
    loadFields();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Add new field
  const handleAddField = () => {
    const newFld: SimpleField = {
      label: '',
      field_type: 'text',
      is_required: false,
      options: [],
    };
    setFields([...fields, newFld]);
  };

  // Update field property
  const handleUpdateField = (index: number, key: keyof SimpleField, value: any) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  // Update dropdown options (from comma-separated string)
  const handleUpdateOptions = (index: number, commaSeparated: string) => {
    const opts = commaSeparated
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ label: s, value: s }));
    handleUpdateField(index, 'options', opts);
  };

  // Move field up/down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;

    setFields((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Remove field
  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Reset to standard fields
  const handleResetToDefault = () => {
    if (window.confirm('Reset form fields to standard property registration fields?')) {
      setFields(DEFAULT_FIELDS);
      showFeedback('success', 'Reset to standard fields. Click "Save Changes" to apply.');
    }
  };

  // Save fields directly
  const handleSave = async () => {
    // Validate that labels are entered
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        showFeedback('error', `Field #${i + 1} has an empty name. Please enter a name or delete it.`);
        return;
      }
    }

    setSaving(true);
    try {
      await saveActiveFormFieldsDirect(fields);
      showFeedback('success', 'Form fields saved successfully! Connect portal is updated.');
    } catch (err: any) {
      console.error('Save failed:', err);
      showFeedback('error', err.message || 'Failed to save form fields.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-semibold">Loading Form Configuration...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Header Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-apple-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]">
              <FileText className="w-4 h-4" />
            </span>
            <span>Form Fields</span>
          </h2>
          <p className="text-xs text-[#86868b] mt-1">
            Configure dynamic fields for the property registration portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.08] text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
            title="Reset to default fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleAddField}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Field</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-medium border animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/80 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Fields List */}
      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-black/[0.08] rounded-3xl p-6">
            <p className="text-xs text-[#86868b] mb-4">No fields configured yet.</p>
            <button
              type="button"
              onClick={handleAddField}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white text-xs font-semibold active:scale-[0.98] shadow-apple-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Field</span>
            </button>
          </div>
        ) : (
          fields.map((field, idx) => {
            const optionsString = Array.isArray(field.options)
              ? field.options.map((o: any) => o.label || o.value || o).join(', ')
              : '';

            return (
              <div
                key={idx}
                className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-5 transition-all hover:border-black/[0.12] shadow-apple-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: Index & Name */}
                  <div className="flex items-center gap-2.5 w-full sm:w-1/2">
                    <span className="w-7 h-7 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                        placeholder="Field Name"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] placeholder:text-[#86868b] text-xs font-medium focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Middle: Type Selector */}
                  <div className="w-full sm:w-1/3">
                    <select
                      value={field.field_type}
                      onChange={(e) => handleUpdateField(idx, 'field_type', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-xs font-medium focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 outline-none transition-all cursor-pointer"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Right: Required Checkbox, Move Buttons, Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.04]">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={field.is_required}
                        onChange={(e) => handleUpdateField(idx, 'is_required', e.target.checked)}
                        className="w-4 h-4 rounded-md border-black/20 text-[#1d1d1f] focus:ring-0 cursor-pointer accent-[#1d1d1f]"
                      />
                      <span className="text-[11px] font-medium text-[#1d1d1f]">Required</span>
                    </label>

                    <div className="flex items-center gap-1 border-l border-black/[0.06] pl-2">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-25 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === fields.length - 1}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-25 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 ml-1 transition-colors cursor-pointer"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional: Dropdown options input if field_type === 'dropdown' */}
                {field.field_type === 'dropdown' && (
                  <div className="pt-2.5 border-t border-black/[0.04]">
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                      Options (comma-separated):
                    </label>
                    <input
                      type="text"
                      defaultValue={optionsString}
                      onBlur={(e) => handleUpdateOptions(idx, e.target.value)}
                      placeholder="e.g. Rent, Re-sale"
                      className="w-full px-3.5 py-1.5 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] placeholder:text-[#86868b] text-xs focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Save & Add Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/[0.06]">
        <button
          type="button"
          onClick={handleAddField}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.08] text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Field</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
