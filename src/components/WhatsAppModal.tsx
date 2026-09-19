import React, { useState } from 'react';
import { Submission } from '../types/panel';
import { X, MessageSquare, ExternalLink, Copy, Check } from 'lucide-react';

interface WhatsAppModalProps {
  submission: Submission;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  submission,
  isOpen,
  onClose,
}) => {
  const cleanPhone = (submission.owner_phone || '').replace(/\D/g, '');
  const indianNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const defaultTemplates = [
    {
      title: 'Initial Verification',
      text: `Hello ${submission.owner_name || 'Sir/Madam'}, thank you for registering your property (${submission.property_type || 'Property'} in ${submission.city || 'Gujarat'}) with PropKart (ID: ${submission.registration_code}). I am calling from the PropKart verified desk to confirm your listing details and assist you. Are you available for a quick discussion?`,
    },
    {
      title: 'Request Missing Photos/Video',
      text: `Hello ${submission.owner_name || 'Sir/Madam'}, regarding your PropKart property registration (${submission.registration_code}), our team noticed we need additional high-resolution photos or a video walkthrough to showcase your property to premium buyers. Could you please share them on this WhatsApp chat?`,
    },
    {
      title: 'Site Visit / Buyer Inquiry',
      text: `Hello ${submission.owner_name || 'Sir/Madam'}, we have received an active buyer inquiry interested in visiting your property in ${submission.city || 'Gujarat'} (ID: ${submission.registration_code}). When would be a convenient time for a site visit?`,
    },
  ];

  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [customMessage, setCustomMessage] = useState(defaultTemplates[0].text);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSelectTemplate = (idx: number) => {
    setSelectedTemplate(idx);
    setCustomMessage(defaultTemplates[idx].text);
  };

  const openWhatsApp = () => {
    const encoded = encodeURIComponent(customMessage);
    const url = `https://wa.me/${indianNumber}?text=${encoded}`;
    window.open(url, '_blank');
    onClose();
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display">Send WhatsApp Message</h3>
              <p className="text-[11px] text-slate-500">To: {submission.owner_name} (+{indianNumber})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Templates Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select Message Template</label>
            <div className="flex flex-wrap gap-2">
              {defaultTemplates.map((t, idx) => (
                <button
                  key={t.title}
                  onClick={() => handleSelectTemplate(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedTemplate === idx
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Text Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Message Content</label>
            <textarea
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs leading-relaxed focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <button
            onClick={copyMessage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={openWhatsApp}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
