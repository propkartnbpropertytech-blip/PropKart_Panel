import React, { useState, useEffect } from 'react';
import { FormField, FieldType, FieldOption } from '../types/panel';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface FieldEditorModalProps {
  field: FormField | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedField: FormField) => void;
}

const FIELD_TYPES: { type: FieldType; label: string; group: string }[] = [
  { type: 'name', label: 'Full Name', group: 'Contact' },
  { type: 'phone', label: 'Mobile Number (+91)', group: 'Contact' },
  { type: 'email', label: 'Email Address', group: 'Contact' },
  { type: 'text', label: 'Short Text', group: 'Text' },
  { type: 'textarea', label: 'Long Text / Address', group: 'Text' },
  { type: 'dropdown', label: 'Dropdown Selection', group: 'Selection' },
  { type: 'radio', label: 'Radio Button Cards', group: 'Selection' },
  { type: 'multiselect', label: 'Multi-Select Badges', group: 'Selection' },
  { type: 'currency', label: 'Currency (₹ Rupees)', group: 'Numeric' },
  { type: 'area', label: 'Area (Sq. Ft / Yards)', group: 'Numeric' },
  { type: 'number', label: 'Number / Count', group: 'Numeric' },
  { type: 'photos', label: 'Property Photos (Up to 50)', group: 'Media' },
  { type: 'videos', label: 'Property Videos (Up to 30)', group: 'Media' },
  { type: 'google_location', label: 'Google Maps Location Picker', group: 'Location' },
  { type: 'direction', label: 'Direction & Landmarks', group: 'Location' },
  { type: 'remarks', label: 'Additional Remarks', group: 'Other' },
  { type: 'consent', label: 'Owner Declaration Consent', group: 'Other' },
];

export const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
  field,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<FormField>({
    field_key: '',
    label: '',
    field_type: 'text',
    placeholder: '',
    help_text: '',
    description: '',
    is_required: false,
    is_active: true,
    display_order: 1,
    validation_rules: {},
    options: [],
  });

  const [optionsList, setOptionsList] = useState<FieldOption[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (field) {
      setFormData({
        ...field,
        validation_rules: field.validation_rules || {},
      });
      setOptionsList(field.options || []);
    } else {
      setFormData({
        field_key: '',
        label: '',
        field_type: 'text',
        placeholder: '',
        help_text: '',
        description: '',
        is_required: false,
        is_active: true,
        display_order: 1,
        validation_rules: {},
        options: [],
      });
      setOptionsList([]);
    }
    setError(null);
  }, [field, isOpen]);

  if (!isOpen) return null;

  const handleLabelChange = (val: string) => {
    const autoKey = val.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    setFormData((prev) => ({
      ...prev,
      label: val,
      field_key: prev.field_key && field ? prev.field_key : autoKey,
    }));
  };

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    setOptionsList([...optionsList, { label: newOptionLabel.trim(), value: newOptionLabel.trim() }]);
    setNewOptionLabel('');
  };

  const handleRemoveOption = (index: number) => {
    setOptionsList(optionsList.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      setError('Field label is required.');
      return;
    }
    if (!formData.field_key.trim()) {
      setError('Internal field key is required.');
      return;
    }

    onSave({
      ...formData,
      options: optionsList,
    });
    onClose();
  };

  const isSelectionType = ['dropdown', 'radio', 'multiselect'].includes(formData.field_type);
  const isMediaType = ['photos', 'videos'].includes(formData.field_type);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-white">
            {field ? 'Edit Dynamic Field' : 'Add New Dynamic Field'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Label and Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Field Label <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g. Property Facing"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Internal Key (database key) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.field_key}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))
                }
                placeholder="e.g. property_facing"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 text-xs font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Field Type</label>
            <select
              value={formData.field_type}
              onChange={(e) => setFormData((p) => ({ ...p, field_type: e.target.value as FieldType }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.type} value={ft.type}>
                  {ft.group}: {ft.label}
                </option>
              ))}
            </select>
          </div>

          {/* Placeholder and Help Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Placeholder</label>
              <input
                type="text"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData((p) => ({ ...p, placeholder: e.target.value }))}
                placeholder="e.g. Select Facing..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Help Text</label>
              <input
                type="text"
                value={formData.help_text || ''}
                onChange={(e) => setFormData((p) => ({ ...p, help_text: e.target.value }))}
                placeholder="e.g. Main door facing direction"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Toggles: Required & Active */}
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData((p) => ({ ...p, is_required: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-200">Mandatory / Required Field</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-200">Active (Visible in Form)</span>
            </label>
          </div>

          {/* Media Limits (Photos & Videos) */}
          {isMediaType && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-300">Media Upload Constraints</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Maximum Files Limit ({formData.field_type === 'photos' ? 'Up to 50' : 'Up to 30'})
                  </label>
                  <input
                    type="number"
                    value={formData.validation_rules?.max_files || (formData.field_type === 'photos' ? 50 : 30)}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        validation_rules: {
                          ...p.validation_rules,
                          max_files: Number(e.target.value),
                        },
                      }))
                    }
                    min={1}
                    max={formData.field_type === 'photos' ? 50 : 30}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Max File Size (MB)</label>
                  <input
                    type="number"
                    value={formData.validation_rules?.max_file_size_mb || (formData.field_type === 'photos' ? 25 : 50)}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        validation_rules: {
                          ...p.validation_rules,
                          max_file_size_mb: Number(e.target.value),
                        },
                      }))
                    }
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Options Manager (for Dropdown / Radio / Multiselect) */}
          {isSelectionType && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-300">Selection Options</div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  placeholder="Add option (e.g. East, 2 BHK, Lift)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {optionsList.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                  >
                    <span>{opt.label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Save Field</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
