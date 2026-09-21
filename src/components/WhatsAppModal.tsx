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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white border border-black/[0.08] rounded-3xl w-full max-w-lg shadow-apple-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between text-[#1d1d1f]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-apple-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1f]">WhatsApp</h3>
              <p className="text-[11px] text-[#86868b]">To: {submission.owner_name} (+{indianNumber})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Templates Pills */}
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-2">Select Template</label>
            <div className="flex flex-wrap gap-2">
              {defaultTemplates.map((t, idx) => (
                <button
                  key={t.title}
                  onClick={() => handleSelectTemplate(idx)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedTemplate === idx
                      ? 'bg-[#1d1d1f] text-white shadow-apple-sm'
                      : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f]'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Text Area */}
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">Message Content</label>
            <textarea
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-xs leading-relaxed focus:bg-white focus:border-black/20 focus:ring-2 focus:ring-black/5 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-black/[0.06] flex items-center justify-between gap-3 bg-[#f5f5f7]/50">
          <button
            onClick={copyMessage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/[0.08] text-[#1d1d1f] text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-[#86868b] hover:text-[#1d1d1f] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={openWhatsApp}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
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
