import React, { useState } from 'react';
import { FormSection } from '../types/panel';
import { Smartphone, Monitor, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface LiveFormPreviewProps {
  sections: FormSection[];
  formTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveFormPreview: React.FC<LiveFormPreviewProps> = ({
  sections,
  formTitle,
  isOpen,
  onClose,
}) => {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const currentSection = sections[activeStep] || sections[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 mb-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Form Preview</span>
          <span className="text-sm font-semibold text-white truncate max-w-xs">{formTitle}</span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceMode === 'mobile'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (390px)</span>
          </button>
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceMode === 'desktop'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Frame Container */}
      <div className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden">
        <div
          className={`h-full max-h-[750px] bg-slate-50 text-slate-900 overflow-y-auto transition-all duration-300 shadow-2xl flex flex-col ${
            deviceMode === 'mobile'
              ? 'w-[390px] rounded-[42px] border-[10px] border-slate-800 ring-1 ring-slate-700/50'
              : 'w-full rounded-2xl border border-slate-300'
          }`}
        >
          {/* Mobile Speaker / Notch Bar */}
          {deviceMode === 'mobile' && (
            <div className="h-6 bg-slate-100 flex items-center justify-center shrink-0">
              <div className="w-24 h-4 bg-slate-900 rounded-b-xl"></div>
            </div>
          )}

          {/* Preview Navigation Header */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                P
              </div>
              <span className="text-xs font-bold text-slate-800">PropKart Connect</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Preview Mode
            </span>
          </div>

          {/* Steps Progress */}
          <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between gap-1 overflow-x-auto">
            {sections.map((sec, idx) => (
              <button
                key={sec.id || idx}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                  idx === activeStep
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  idx === activeStep ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {idx + 1}
                </span>
                <span className="truncate max-w-[80px]">{sec.title}</span>
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="p-5 flex-1 space-y-5 overflow-y-auto">
            {currentSection && (
              <>
                <div className="border-b border-slate-200 pb-3">
                  <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                    Step {activeStep + 1} of {sections.length}
                  </div>
                  <h3 className="text-lg font-bold font-display text-slate-900 mt-0.5">
                    {currentSection.title}
                  </h3>
                  {currentSection.description && (
                    <p className="text-xs text-slate-500 mt-1">{currentSection.description}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {currentSection.fields.map((field) => (
                    <div key={field.field_key} className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {field.label}
                        {field.is_required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                      </label>

                      {field.field_type === 'textarea' || field.field_type === 'remarks' ? (
                        <textarea
                          disabled
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          rows={2}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white placeholder:text-slate-400"
                        />
                      ) : field.field_type === 'dropdown' ? (
                        <select
                          disabled
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700"
                        >
                          <option>{field.placeholder || `Select ${field.label}`}</option>
                          {field.options?.map((opt) => (
                            <option key={String(opt.value)}>{opt.label}</option>
                          ))}
                        </select>
                      ) : field.field_type === 'radio' ? (
                        <div className="grid grid-cols-2 gap-2">
                          {field.options?.map((opt) => (
                            <div
                              key={String(opt.value)}
                              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-700 flex items-center justify-between"
                            >
                              <span>{opt.label}</span>
                              <span className="w-3 h-3 rounded-full border border-slate-300"></span>
                            </div>
                          ))}
                        </div>
                      ) : field.field_type === 'photos' ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-100/50">
                          <div className="text-xs font-semibold text-slate-700">Property Photos Upload</div>
                          <div className="text-[10px] text-slate-400">Up to {field.validation_rules?.max_files || 50} photos supported</div>
                        </div>
                      ) : field.field_type === 'videos' ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-100/50">
                          <div className="text-xs font-semibold text-slate-700">Property Videos Upload</div>
                          <div className="text-[10px] text-slate-400">Up to {field.validation_rules?.max_files || 30} videos supported</div>
                        </div>
                      ) : (
                        <input
                          disabled
                          type="text"
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white placeholder:text-slate-400"
                        />
                      )}

                      {field.help_text && (
                        <p className="text-[10px] text-slate-400">{field.help_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer Controls in Preview */}
          <div className="bg-white border-t border-slate-200 p-3 shrink-0 flex items-center justify-between">
            <button
              onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
              disabled={activeStep === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setActiveStep((p) => Math.min(sections.length - 1, p + 1))}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              {activeStep === sections.length - 1 ? 'Submit Registration' : 'Next Step'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
