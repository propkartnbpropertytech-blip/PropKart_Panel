import React, { useState, useEffect } from 'react';
import { fetchActiveFormSchema, saveActiveFormFieldsDirect, updateAssistancePhone } from '../services/api';
import {
  fetchPreSalesSchema,
  savePreSalesSchema,
  resetPreSalesSchema,
  DEFAULT_PRESALES_FIELDS,
} from '../services/listingsService';
import { PreSalesField } from '../types/panel';
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
  Building2,
  Sparkles,
  Phone,
  PhoneCall,
  ExternalLink,
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

const PRESALES_FIELD_TYPES = [
  { value: 'text', label: 'Text Field' },
  { value: 'number', label: 'Numeric (Price, Area, Floors)' },
  { value: 'dropdown', label: 'Dropdown Selection' },
  { value: 'textarea', label: 'Long Description / Address' },
  { value: 'date', label: 'Possession Date / Milestone' },
  { value: 'photos', label: 'Project Photos & Elevations' },
  { value: 'videos', label: 'Walkthrough Video Link' },
  { value: 'google_location', label: 'Google Maps Link' },
  { value: 'url', label: 'Brochure / Website Link' },
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
  // Tab selector: 'connect_form' vs 'presales_form'
  const [activeBuilderTab, setActiveBuilderTab] = useState<'connect_form' | 'presales_form'>('connect_form');

  // Connect Form State
  const [fields, setFields] = useState<SimpleField[]>([]);
  const [loadingConnect, setLoadingConnect] = useState(true);
  const [savingConnect, setSavingConnect] = useState(false);

  // Pre-sales Form State & Assistance Phone
  const [presalesFields, setPresalesFields] = useState<PreSalesField[]>([]);
  const [loadingPresales, setLoadingPresales] = useState(true);
  const [savingPresales, setSavingPresales] = useState(false);
  const [assistancePhone, setAssistancePhone] = useState<string>('+91 99742 09999');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load Connect Form fields
  useEffect(() => {
    async function loadConnectFields() {
      setLoadingConnect(true);
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
        console.error('Failed to load Connect fields:', err);
        setFields(DEFAULT_FIELDS);
      } finally {
        setLoadingConnect(false);
      }
    }
    loadConnectFields();
  }, []);

  // Load Pre-sales Form fields & Assistance Phone
  useEffect(() => {
    async function loadPresalesSchema() {
      setLoadingPresales(true);
      try {
        const [pFields, activeData] = await Promise.allSettled([
          fetchPreSalesSchema(),
          fetchActiveFormSchema(),
        ]);

        if (pFields.status === 'fulfilled' && pFields.value && pFields.value.length > 0) {
          setPresalesFields(pFields.value);
        } else {
          setPresalesFields(DEFAULT_PRESALES_FIELDS);
        }

        if (activeData.status === 'fulfilled' && activeData.value?.assistance_phone) {
          setAssistancePhone(activeData.value.assistance_phone);
          localStorage.setItem('propkart_assistance_phone', activeData.value.assistance_phone);
        } else {
          const cached = localStorage.getItem('propkart_assistance_phone');
          if (cached) setAssistancePhone(cached);
        }
      } catch (err) {
        console.error('Failed to load Pre-sales fields:', err);
        setPresalesFields(DEFAULT_PRESALES_FIELDS);
      } finally {
        setLoadingPresales(false);
      }
    }
    loadPresalesSchema();
  }, []);

  // ==========================================
  // CONNECT FORM HANDLERS
  // ==========================================
  const handleAddConnectField = () => {
    const newFld: SimpleField = {
      label: '',
      field_type: 'text',
      is_required: false,
      options: [],
    };
    setFields([...fields, newFld]);
  };

  const handleUpdateConnectField = (index: number, key: keyof SimpleField, value: any) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleUpdateConnectOptions = (index: number, commaSeparated: string) => {
    const opts = commaSeparated
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ label: s, value: s }));
    handleUpdateConnectField(index, 'options', opts);
  };

  const handleMoveConnect = (index: number, direction: 'up' | 'down') => {
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

  const handleRemoveConnectField = (index: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleResetConnectDefault = () => {
    if (window.confirm('Reset public registration form to standard fields?')) {
      setFields(DEFAULT_FIELDS);
      showFeedback('success', 'Reset to standard registration fields. Click "Save" to apply.');
    }
  };

  const handleSaveConnect = async () => {
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        showFeedback('error', `Field #${i + 1} has an empty name. Please enter a name or delete it.`);
        return;
      }
    }
    setSavingConnect(true);
    try {
      await saveActiveFormFieldsDirect(fields);
      showFeedback('success', 'Public registration form fields saved! Connect portal is updated.');
    } catch (err: any) {
      console.error('Save failed:', err);
      showFeedback('error', err.message || 'Failed to save form fields.');
    } finally {
      setSavingConnect(false);
    }
  };

  // ==========================================
  // PRE-SALES FORM HANDLERS
  // ==========================================
  const handleAddPresalesField = () => {
    const newFieldKey = `custom_${Date.now()}`;
    const newFld: PreSalesField = {
      field_key: newFieldKey,
      label: 'New Pre-sales Field',
      field_type: 'text',
      is_required: false,
      placeholder: 'Enter details...',
    };
    setPresalesFields([...presalesFields, newFld]);
  };

  const handleUpdatePresalesField = (index: number, key: keyof PreSalesField, value: any) => {
    setPresalesFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleUpdatePresalesOptions = (index: number, commaSeparated: string) => {
    const opts = commaSeparated
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ label: s, value: s }));
    handleUpdatePresalesField(index, 'options', opts);
  };

  const handleMovePresales = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= presalesFields.length) return;
    setPresalesFields((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleRemovePresalesField = (index: number) => {
    setPresalesFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleResetPresalesDefault = () => {
    if (window.confirm('Reset Pre-sales form schema to default recommended fields?')) {
      const def = resetPreSalesSchema();
      setPresalesFields(def);
      showFeedback('success', 'Reset Pre-sales schema to default fields. Click "Save" to apply.');
    }
  };

  const handleSavePresales = async () => {
    for (let i = 0; i < presalesFields.length; i++) {
      if (!presalesFields[i].label.trim()) {
        showFeedback('error', `Pre-sales Field #${i + 1} has an empty label. Please enter a label or remove it.`);
        return;
      }
    }
    setSavingPresales(true);
    try {
      await savePreSalesSchema(presalesFields);
      showFeedback('success', 'Pre-sales listing schema saved! "Add Pre-sales property" modal is updated.');
    } catch (err: any) {
      console.error('Save presales schema failed:', err);
      showFeedback('error', err.message || 'Failed to save Pre-sales schema.');
    } finally {
      setSavingPresales(false);
    }
  };

  const handleSaveAssistancePhone = async () => {
    if (!assistancePhone.trim()) {
      showFeedback('error', 'Assistance mobile number cannot be empty.');
      return;
    }
    setIsSavingPhone(true);
    try {
      await updateAssistancePhone(assistancePhone.trim());
      localStorage.setItem('propkart_assistance_phone', assistancePhone.trim());
      try {
        const channel = new BroadcastChannel('propkart_listing_channel');
        channel.postMessage({ type: 'ASSISTANCE_PHONE_UPDATED', phone: assistancePhone.trim() });
        channel.close();
      } catch (e) {}
      showFeedback('success', 'Assistance mobile number saved! Live synchronized across Listing & Pre-sales apps.');
    } catch (err: any) {
      localStorage.setItem('propkart_assistance_phone', assistancePhone.trim());
      try {
        const channel = new BroadcastChannel('propkart_listing_channel');
        channel.postMessage({ type: 'ASSISTANCE_PHONE_UPDATED', phone: assistancePhone.trim() });
        channel.close();
      } catch (e) {}
      showFeedback('success', 'Assistance mobile number saved locally and synchronized across tabs.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const isLoading = activeBuilderTab === 'connect_form' ? loadingConnect : loadingPresales;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-semibold">Loading Dynamic Form Configuration...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* ==================================================== */}
      {/* TOP TAB SWITCHER: Public Registration vs Pre-sales Form */}
      {/* ==================================================== */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-fit border border-black/[0.04]">
        <button
          type="button"
          onClick={() => setActiveBuilderTab('connect_form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeBuilderTab === 'connect_form'
              ? 'bg-white text-slate-900 shadow-apple-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Public Registration Form (Connect)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
            {fields.length} Fields
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBuilderTab('presales_form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeBuilderTab === 'presales_form'
              ? 'bg-white text-slate-900 shadow-apple-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-600" />
          <span>Pre-sales Listing Form Builder</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono">
            {presalesFields.length} Fields
          </span>
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-apple-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              activeBuilderTab === 'presales_form' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-[#1d1d1f]'
            }`}>
              {activeBuilderTab === 'presales_form' ? <Building2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </span>
            <span>
              {activeBuilderTab === 'presales_form' ? 'Pre-sales Listing Form Schema' : 'Public Registration Form Fields'}
            </span>
          </h2>
          <p className="text-xs text-[#86868b] mt-1">
            {activeBuilderTab === 'presales_form'
              ? 'Configure dynamic fields used when operators add upcoming Pre-sales properties into the Listing tab and showcase.'
              : 'Configure dynamic fields rendered on PropKart Connect public registration wizard.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={activeBuilderTab === 'presales_form' ? handleResetPresalesDefault : handleResetConnectDefault}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.08] text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
            title="Reset to default fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={activeBuilderTab === 'presales_form' ? handleAddPresalesField : handleAddConnectField}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Field</span>
          </button>

          <button
            type="button"
            onClick={activeBuilderTab === 'presales_form' ? handleSavePresales : handleSaveConnect}
            disabled={activeBuilderTab === 'presales_form' ? savingPresales : savingConnect}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {(activeBuilderTab === 'presales_form' ? savingPresales : savingConnect) ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Schema</span>
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

      {/* ==================================================== */}
      {/* TAB 1: CONNECT REGISTRATION FORM FIELDS */}
      {/* ==================================================== */}
      {activeBuilderTab === 'connect_form' && (
        <div className="space-y-3">
          {fields.map((field, idx) => {
            const optionsString = Array.isArray(field.options)
              ? field.options.map((o: any) => o.label || o.value || o).join(', ')
              : '';

            return (
              <div
                key={idx}
                className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-5 transition-all hover:border-black/[0.12] shadow-apple-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 w-full sm:w-1/2">
                    <span className="w-7 h-7 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateConnectField(idx, 'label', e.target.value)}
                        placeholder="Field Name"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] placeholder:text-[#86868b] text-xs font-medium focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="w-full sm:w-1/3">
                    <select
                      value={field.field_type}
                      onChange={(e) => handleUpdateConnectField(idx, 'field_type', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-xs font-medium focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 outline-hidden transition-all cursor-pointer"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.04]">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={field.is_required}
                        onChange={(e) => handleUpdateConnectField(idx, 'is_required', e.target.checked)}
                        className="w-4 h-4 rounded-md border-black/20 text-[#1d1d1f] focus:ring-0 cursor-pointer accent-[#1d1d1f]"
                      />
                      <span className="text-[11px] font-medium text-[#1d1d1f]">Required</span>
                    </label>

                    <div className="flex items-center gap-1 border-l border-black/[0.06] pl-2">
                      <button
                        type="button"
                        onClick={() => handleMoveConnect(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-25 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveConnect(idx, 'down')}
                        disabled={idx === fields.length - 1}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-25 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveConnectField(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 ml-1 transition-colors cursor-pointer"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {field.field_type === 'dropdown' && (
                  <div className="pt-2.5 border-t border-black/[0.04]">
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                      Options (comma-separated):
                    </label>
                    <input
                      type="text"
                      defaultValue={optionsString}
                      onBlur={(e) => handleUpdateConnectOptions(idx, e.target.value)}
                      placeholder="e.g. Rent, Re-sale"
                      className="w-full px-3.5 py-1.5 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] placeholder:text-[#86868b] text-xs focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 outline-hidden transition-all"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: PRE-SALES LISTING FORM BUILDER */}
      {/* ==================================================== */}
      {activeBuilderTab === 'presales_form' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between text-xs text-purple-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                These dynamic fields are rendered in the <strong>"Add Pre-sales property"</strong> modal on the Listing tab.
              </span>
            </div>
            <span className="font-mono text-[11px] bg-purple-200/80 px-2 py-0.5 rounded-md font-bold text-purple-900">
              v1.0 Pre-sales Schema
            </span>
          </div>

          {/* Synchronized Assistance / Support Mobile Number Card */}
          <div className="bg-white border-2 border-emerald-200/90 rounded-2xl p-5 shadow-apple-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Synchronized Support & Assistance Mobile Number</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Sync
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This number is broadcasted live to <strong>listing.nbpropertytech.com</strong> and <strong>presales.nbpropertytech.com</strong> for visitor inquiries.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <a
                  href="http://localhost:3003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-purple-200"
                  title="Preview Pre-sales Portal"
                >
                  <span>Pre-sales Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleSaveAssistancePhone}
                  disabled={isSavingPhone}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-apple-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPhone ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save & Sync Phone</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-1/2 relative">
                <input
                  type="text"
                  value={assistancePhone}
                  onChange={(e) => setAssistancePhone(e.target.value)}
                  placeholder="e.g. +91 99742 09999"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] font-mono text-xs font-bold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400">
                Format: Include country code (+91) followed by 10-digit mobile number.
              </p>
            </div>
          </div>

          {presalesFields.map((field, idx) => {
            const optionsString = Array.isArray(field.options)
              ? field.options.map((o: any) => o.label || o.value || o).join(', ')
              : '';

            return (
              <div
                key={field.field_key || idx}
                className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-5 transition-all hover:border-purple-200 shadow-apple-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: Index & Name */}
                  <div className="flex items-center gap-2.5 w-full sm:w-1/2">
                    <span className="w-7 h-7 rounded-full bg-purple-50 text-purple-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-purple-100">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdatePresalesField(idx, 'label', e.target.value)}
                        placeholder="Field Label / Question"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] placeholder:text-[#86868b] text-xs font-semibold focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  {/* Middle: Type Selector */}
                  <div className="w-full sm:w-1/3">
                    <select
                      value={field.field_type}
                      onChange={(e) => handleUpdatePresalesField(idx, 'field_type', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-xs font-medium focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-hidden transition-all cursor-pointer"
                    >
                      {PRESALES_FIELD_TYPES.map((t) => (
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
                        onChange={(e) => handleUpdatePresalesField(idx, 'is_required', e.target.checked)}
                        className="w-4 h-4 rounded-md border-black/20 text-purple-600 focus:ring-0 cursor-pointer accent-purple-600"
                      />
                      <span className="text-[11px] font-medium text-slate-800">Required</span>
                    </label>

                    <div className="flex items-center gap-1 border-l border-black/[0.06] pl-2">
                      <button
                        type="button"
                        onClick={() => handleMovePresales(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-25 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMovePresales(idx, 'down')}
                        disabled={idx === presalesFields.length - 1}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-25 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemovePresalesField(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 ml-1 transition-colors cursor-pointer"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-inputs: Options (if dropdown) & Placeholder */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-black/[0.04]">
                  {field.field_type === 'dropdown' ? (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Dropdown Options (comma-separated):
                      </label>
                      <input
                        type="text"
                        defaultValue={optionsString}
                        onBlur={(e) => handleUpdatePresalesOptions(idx, e.target.value)}
                        placeholder="Option 1, Option 2, Option 3"
                        className="w-full px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-xs focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Field Key Identifier:
                      </label>
                      <input
                        type="text"
                        value={field.field_key}
                        onChange={(e) => handleUpdatePresalesField(idx, 'field_key', e.target.value)}
                        placeholder="e.g. project_name"
                        className="w-full px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-transparent text-slate-600 font-mono text-xs focus:bg-white focus:border-purple-300 outline-hidden transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Input Placeholder / Hint:
                    </label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => handleUpdatePresalesField(idx, 'placeholder', e.target.value)}
                      placeholder="e.g. Enter project title..."
                      className="w-full px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-xs focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Save & Add Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/[0.06]">
        <button
          type="button"
          onClick={activeBuilderTab === 'presales_form' ? handleAddPresalesField : handleAddConnectField}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.08] text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Field</span>
        </button>

        <button
          type="button"
          onClick={activeBuilderTab === 'presales_form' ? handleSavePresales : handleSaveConnect}
          disabled={activeBuilderTab === 'presales_form' ? savingPresales : savingConnect}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          {(activeBuilderTab === 'presales_form' ? savingPresales : savingConnect) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save {activeBuilderTab === 'presales_form' ? 'Pre-sales Schema' : 'Changes'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
