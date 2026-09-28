import React, { useState, useEffect } from 'react';
import { PreSalesField, ListingProperty } from '../types/panel';
import { fetchPreSalesSchema, addPreSalesProperty } from '../services/listingsService';
import {
  X,
  Plus,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Image as ImageIcon,
  Video as VideoIcon,
  ExternalLink,
} from 'lucide-react';

interface AddPreSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProperty: ListingProperty) => void;
}

export const AddPreSalesModal: React.FC<AddPreSalesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [schemaFields, setSchemaFields] = useState<PreSalesField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    async function loadSchema() {
      setLoading(true);
      try {
        const fields = await fetchPreSalesSchema();
        setSchemaFields(fields);
        // Initialize default form data
        const initial: Record<string, any> = {};
        fields.forEach((f) => {
          if (f.field_type === 'dropdown' && Array.isArray(f.options) && f.options.length > 0) {
            initial[f.field_key] = typeof f.options[0] === 'object' ? f.options[0].value : f.options[0];
          } else {
            initial[f.field_key] = '';
          }
        });
        setFormData(initial);
      } catch (e) {
        console.error('Error loading presales schema', e);
      } finally {
        setLoading(false);
      }
    }
    loadSchema();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    schemaFields.forEach((f) => {
      if (f.is_required) {
        const val = formData[f.field_key];
        if (val === undefined || val === null || String(val).trim() === '') {
          newErrors[f.field_key] = `${f.label} is required`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await addPreSalesProperty(formData);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create Pre-sales property');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-black/[0.08]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-black/[0.06] flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Add Pre-Sales Property</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Dynamic Schema
                </span>
              </h2>
              <p className="text-xs text-slate-500 truncate sm:whitespace-normal">
                Fields are rendered directly from the Pre-Sales Listing Form Builder.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-black/[0.04] transition-all shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <span className="text-xs font-semibold">Loading dynamic form schema...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {schemaFields.map((field) => {
                const val = formData[field.field_key] ?? '';
                const hasError = !!errors[field.field_key];

                // Dropdown field
                if (field.field_type === 'dropdown') {
                  const opts = Array.isArray(field.options) ? field.options : [];
                  return (
                    <div key={field.field_key} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                      </label>
                      <select
                        value={val}
                        onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                          hasError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      >
                        {opts.map((opt: any) => {
                          const label = typeof opt === 'object' ? opt.label : opt;
                          const value = typeof opt === 'object' ? opt.value : opt;
                          return (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                      {hasError && <p className="text-[11px] text-rose-500">{errors[field.field_key]}</p>}
                    </div>
                  );
                }

                // Textarea field
                if (field.field_type === 'textarea') {
                  return (
                    <div key={field.field_key} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                      </label>
                      <textarea
                        rows={3}
                        value={val}
                        onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none ${
                          hasError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      />
                      {hasError && <p className="text-[11px] text-rose-500">{errors[field.field_key]}</p>}
                    </div>
                  );
                }

                // Photos / Image URLs
                if (field.field_type === 'photos') {
                  return (
                    <div key={field.field_key} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>
                          {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Comma-separated image URLs (up to 100)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder || 'https://images.unsplash.com/...'}
                          className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                            hasError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                          }`}
                        />
                        <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      </div>
                      {hasError && <p className="text-[11px] text-rose-500">{errors[field.field_key]}</p>}
                    </div>
                  );
                }

                // Videos / Video URLs
                if (field.field_type === 'videos') {
                  return (
                    <div key={field.field_key} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>
                          {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Comma-separated video URLs (up to 50)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder || 'https://.../tour.mp4'}
                          className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                            hasError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                          }`}
                        />
                        <VideoIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      </div>
                      {hasError && <p className="text-[11px] text-rose-500">{errors[field.field_key]}</p>}
                    </div>
                  );
                }

                // Google Location
                if (field.field_type === 'google_location') {
                  return (
                    <div key={field.field_key} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={val}
                          onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder || 'https://maps.google.com/?q=...'}
                          className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                            hasError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                          }`}
                        />
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      </div>
                      {hasError && <p className="text-[11px] text-rose-500">{errors[field.field_key]}</p>}
                    </div>
                  );
                }

                // Standard Number or Text input
                return (
                  <div key={field.field_key} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {field.label} {field.is_required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type={field.field_type === 'number' ? 'number' : 'text'}
                      value={val}
                      onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                        hasError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {hasError && <p className="text-[11px] text-rose-500">{errors[field.field_key]}</p>}
                  </div>
                );
              })}
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-black/[0.06] bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Auto-toggled ON for Public Showcase</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-black/[0.04] transition-all text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#1d1d1f] hover:bg-black active:scale-95 disabled:opacity-50 transition-all shadow-apple-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Inventory</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
