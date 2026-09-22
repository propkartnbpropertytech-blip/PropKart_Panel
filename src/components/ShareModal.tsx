import React, { useState, useRef } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Printer,
  ExternalLink,
  Download,
  MapPin,
  Compass,
  Phone,
  User,
  Building2,
  Sparkles,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  schema?: any;
  media: any[];
  onShowToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  submission,
  schema,
  media = [],
  onShowToast,
}) => {
  if (!isOpen || !submission) return null;

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'link' | 'pdf'>('whatsapp');
  const [includeOwnerContact, setIncludeOwnerContact] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const raw = submission.raw_data || {};
  const isRent = String(submission.listing_type || '').toLowerCase() === 'rent';

  // Extract active fields from schema to guarantee dynamic behavior
  const activeFields = (schema?.sections || [])
    .flatMap((sec: any) => (sec.fields || []).map((f: any) => ({ ...f, section_title: sec.title })))
    .filter((f: any) => f.is_active !== false);

  const activeKeys = new Set(activeFields.map((f: any) => f.field_key));

  // Determine if landmark field is actively defined in the schema
  const hasLandmarkInSchema = activeKeys.size === 0 ||
    activeKeys.has('direction___landmarks') ||
    activeKeys.has('direction') ||
    activeKeys.has('direction_landmarks') ||
    activeKeys.has('landmark');

  const rawLandmark = raw.direction___landmarks || raw.direction || raw.direction_landmarks || raw.landmark || submission.direction_url;
  const directionLandmark = (hasLandmarkInSchema && rawLandmark && rawLandmark !== 'N/A' && rawLandmark !== 'null' && String(rawLandmark).trim().length > 0)
    ? String(rawLandmark).trim()
    : '';

  // Collect other dynamic specs from active schema
  const dynamicSpecs: Array<{ key: string; label: string; value: string }> = activeFields.filter((f: any) => {
    if ([
      'photos', 'videos', 'consent', 'declaration', 'terms', 'owner_declaration',
      'owner_phone', 'mobile_number', 'phone', 'owner_email', 'email',
      'expected_price', 'property_address', 'address', 'google_maps_location',
      'google_location', 'location_url', 'direction___landmarks', 'direction', 'landmark',
      'direction_landmarks', 'property_for_rent_or_sale', 'listing_type', 'property_type', 'property_type_select'
    ].includes(f.field_key)) return false;

    const val = raw[f.field_key];
    return val !== undefined && val !== null && val !== '' && val !== 'null' && val !== 'N/A';
  }).map((f: any) => ({
    key: f.field_key,
    label: f.label,
    value: typeof raw[f.field_key] === 'object' ? JSON.stringify(raw[f.field_key]) : String(raw[f.field_key]),
  }));

  // Fix Google Maps Link
  const hasMapsInSchema = activeKeys.size === 0 ||
    activeKeys.has('google_maps_location') ||
    activeKeys.has('google_location') ||
    activeKeys.has('location_url');

  const rawMaps = raw.google_maps_location || raw.google_location || raw.location_url;
  const mapsUrl = (hasMapsInSchema)
    ? (submission.location_url && submission.location_url !== 'N/A' && submission.location_url !== 'null'
        ? submission.location_url
        : typeof rawMaps === 'object'
        ? rawMaps?.url || rawMaps?.location_url || ''
        : String(rawMaps || ''))
    : '';

  const photos = (media || []).filter(
    (m: any) => m.media_type === 'photo' || m.storage_path?.match(/\.(jpg|jpeg|png|webp|avif)$/i)
  );

  const publicShowcaseUrl = `https://propconnect.nbpropertytech.com/?view=${encodeURIComponent(
    submission.registration_code
  )}`;

  const formattedPrice = raw.expected_price
    ? `₹${Number(raw.expected_price).toLocaleString('en-IN')}${isRent ? ' / month' : ''}`
    : 'Price on Request';

  // WhatsApp formatted text with dynamic fields
  const getWhatsAppMessage = () => {
    let msg = `🏡 *PropKart Verified Property* (${submission.registration_code})\n` +
      `• *Type:* ${submission.property_type || 'Residential'} (${submission.listing_type || 'Sale'})\n` +
      `• *Price:* ${formattedPrice}\n` +
      `• *Location:* ${submission.address || submission.area || ''}, ${submission.city || 'Ahmedabad'}\n`;

    if (directionLandmark) {
      msg += `• *Landmark:* ${directionLandmark}\n`;
    }

    // Dynamic highlights (BHK, Built-up area, Furnishing, etc.)
    dynamicSpecs.slice(0, 4).forEach((s: { key: string; label: string; value: string }) => {
      msg += `• *${s.label}:* ${s.value}\n`;
    });

    if (mapsUrl) {
      msg += `• *Google Maps:* ${mapsUrl}\n`;
    }

    if (includeOwnerContact && submission.owner_name) {
      msg += `• *Owner:* ${submission.owner_name} (+91 ${submission.owner_phone || ''})\n`;
    }

    msg += `• *Photos:* ${photos.length} verified photos available\n` +
      `🔗 *View Full Property Showcase:*\n` +
      `${publicShowcaseUrl}`;

    return msg;
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopiedText(true);
    onShowToast('WhatsApp message copied to clipboard');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const text = getWhatsAppMessage();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicShowcaseUrl);
    setCopiedLink(true);
    onShowToast('Public showcase link copied');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-apple-xl border border-black/[0.08] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Share Property</h3>
              <p className="text-[11px] text-slate-500 font-mono">{submission.registration_code}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 pb-2 border-b border-black/[0.04] bg-slate-50/50">
          <div className="flex p-1 bg-slate-200/70 rounded-full text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 py-1.5 px-3 rounded-full transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              💬 WhatsApp Share
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-1.5 px-3 rounded-full transition-all cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              🔗 Public Link
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`flex-1 py-1.5 px-3 rounded-full transition-all cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              📄 PDF Dossier
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: WHATSAPP SHARE */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Message Preview:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={includeOwnerContact}
                    onChange={(e) => setIncludeOwnerContact(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-slate-900 w-3.5 h-3.5"
                  />
                  <span>Include Owner Contact</span>
                </label>
              </div>

              {/* Message Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-black/[0.06] font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                {getWhatsAppMessage()}
              </div>

              {/* Photos indicator */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
                <div className="flex items-center gap-2 text-emerald-900">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>
                    <strong>{photos.length} photos</strong> ready in dossier
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">Link embeds photo gallery</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-apple-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-800 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PUBLIC LINK */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  PropKart Connect Public Showcase URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicShowcaseUrl}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs font-mono text-slate-800 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPublicLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-black/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Public Client-Facing View</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Anyone with this link can view the verified property details, high-resolution photo gallery,
                  specifications, and Google Maps location without requiring panel credentials.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={publicShowcaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-800 text-xs font-semibold shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Open Public Showcase in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: PROPER MULTI-PAGE PDF DOSSIER */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <style>{`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 10mm 12mm 12mm 12mm;
                  }
                  html, body {
                    background: white !important;
                    color: #111827 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-property-dossier, #printable-property-dossier * {
                    visibility: visible !important;
                  }
                  #printable-property-dossier {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    background: white !important;
                  }
                  .pdf-avoid-break {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}</style>

              <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Dossier Sheet Preview:</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border">
                    {photos.length} photos (Multi-page A4 ready)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-apple-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>

              {/* Scrollable Preview Wrapper */}
              <div className="max-h-[62vh] overflow-y-auto pr-1">
                {/* Printable Dossier Sheet */}
                <div
                  ref={printRef}
                  id="printable-property-dossier"
                  className="p-6 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-4 text-slate-900"
                >
                  {/* Dossier Header */}
                  <div className="flex items-center justify-between border-b pb-3 pdf-avoid-break">
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-slate-900">
                        PropKart <span className="text-emerald-600">Property Dossier</span>
                      </h2>
                      <p className="text-[10px] text-slate-500">Verified Real Estate Registration</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border">
                        {submission.registration_code}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(submission.created_at || Date.now()).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs pdf-avoid-break">
                    <div className="p-2.5 rounded-xl bg-slate-50 border">
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Purpose</span>
                      <span className="font-semibold text-slate-800">
                        {submission.listing_type || 'Sale'} ({submission.property_type || 'Residential'})
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border">
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Expected Price</span>
                      <span className="font-bold text-slate-900 font-mono">{formattedPrice}</span>
                    </div>

                    <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border">
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Address & Locality</span>
                      <span className="text-slate-800">
                        {submission.address || submission.area || ''}, {submission.city || 'Ahmedabad, Gujarat'}
                      </span>
                    </div>

                    {/* Direction & Landmark: ONLY if active in schema and has value */}
                    {directionLandmark && (
                      <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border">
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                          Direction & Landmark
                        </span>
                        <span className="text-slate-800">{directionLandmark}</span>
                      </div>
                    )}

                    {/* Dynamic Specs from Active Schema */}
                    {dynamicSpecs.map((s: { key: string; label: string; value: string }) => (
                      <div key={s.key} className="p-2.5 rounded-xl bg-slate-50 border">
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">{s.label}</span>
                        <span className="font-semibold text-slate-800 break-words">{s.value}</span>
                      </div>
                    ))}

                    {mapsUrl && (
                      <div className="col-span-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="block text-[10px] text-emerald-800 uppercase font-semibold">
                          Google Maps Location
                        </span>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 underline break-all font-mono text-[11px]"
                        >
                          {mapsUrl}
                        </a>
                      </div>
                    )}

                    {submission.owner_name && (
                      <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border">
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">Owner Contact</span>
                        <span className="text-slate-800 font-medium">
                          {submission.owner_name} (+91 {submission.owner_phone})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Complete Photos Grid (All Uploaded Photos across PDF Pages) */}
                  {photos.length > 0 && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">
                          Property Photos ({photos.length} Verified Photos)
                        </span>
                        <span className="text-[10px] text-slate-400">All photos printed on dossier</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {photos.map((p, idx) => {
                          const pUrl = p.public_url || p.url || (p.storage_path ? `/uploads/${p.storage_path}` : '');
                          return (
                            <div
                              key={p.id || idx}
                              className="pdf-avoid-break aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative"
                            >
                              <img
                                src={pUrl}
                                alt={`Property Photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                                loading="eager"
                                crossOrigin="anonymous"
                              />
                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                                #{idx + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
