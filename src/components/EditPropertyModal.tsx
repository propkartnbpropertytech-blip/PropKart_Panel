import React, { useState, useEffect } from 'react';
import { ListingProperty, ListingType, ListingCategory, ApprovalStatus } from '../types/panel';
import { updateListingProperty } from '../services/listingsService';
import {
  X,
  Save,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Image as ImageIcon,
  Video as VideoIcon,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface EditPropertyModalProps {
  property: ListingProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: ListingProperty) => void;
}

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<ListingProperty> & { amenities_text?: string; photos_text?: string; videos_text?: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (property && isOpen) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        listing_type: property.listing_type,
        property_category: property.property_category,
        property_sub_type: property.property_sub_type || '',
        price: property.price,
        price_unit: property.price_unit || (property.listing_type === 'Rent' ? 'month' : 'total'),
        area: property.area,
        bhk: property.bhk || '',
        developer: property.developer || property.owner_name || '',
        owner_name: property.owner_name || property.developer || '',
        contact_phone: property.contact_phone || property.owner_phone || '',
        owner_phone: property.owner_phone || property.contact_phone || '',
        contact_person: property.contact_person || property.developer || property.owner_name || '',
        address: property.address || '',
        locality: property.locality || '',
        city: property.city || 'Ahmedabad',
        location_url: property.location_url || '',
        possession_date: property.possession_date || '',
        rera_number: property.rera_number || '',
        approval_status: property.approval_status || 'Pending',
        is_approved: property.is_approved === true,
        is_published: property.is_published === true,
        photos_text: property.images ? property.images.join(', ') : '',
        videos_text: property.videos ? property.videos.join(', ') : '',
        amenities_text: property.amenities ? property.amenities.join(', ') : '',
      });
      setError(null);
    }
  }, [property, isOpen]);

  if (!isOpen || !property) return null;

  const handleInputChange = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const formatPricePreview = (num?: number) => {
    if (!num || isNaN(num)) return null;
    if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} Lakhs`;
    return `₹ ${num.toLocaleString('en-IN')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setError('Property title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Parse photos and videos
      const imageList = formData.photos_text
        ? formData.photos_text.split(',').map((s) => s.trim()).filter(Boolean)
        : property.images || [];

      const videoList = formData.videos_text
        ? formData.videos_text.split(',').map((s) => s.trim()).filter(Boolean)
        : property.videos || [];

      const amenitiesList = formData.amenities_text
        ? formData.amenities_text.split(',').map((s) => s.trim()).filter(Boolean)
        : property.amenities || [];

      const patchPayload: Partial<ListingProperty> = {
        title: formData.title,
        description: formData.description,
        listing_type: formData.listing_type as ListingType,
        property_category: formData.property_category as ListingCategory,
        property_sub_type: formData.property_sub_type,
        price: Number(formData.price) || 0,
        price_unit: formData.price_unit as any,
        area: Number(formData.area) || 0,
        bhk: formData.bhk,
        developer: formData.developer,
        owner_name: formData.owner_name,
        contact_person: formData.contact_person,
        contact_phone: formData.contact_phone,
        owner_phone: formData.owner_phone,
        address: formData.address,
        locality: formData.locality,
        city: formData.city,
        location_url: formData.location_url,
        possession_date: formData.possession_date,
        rera_number: formData.rera_number,
        approval_status: formData.approval_status as ApprovalStatus,
        is_approved: formData.approval_status === 'Approved' || formData.is_approved === true,
        is_published: formData.is_published === true,
        images: imageList,
        videos: videoList,
        amenities: amenitiesList,
      };

      const updated = await updateListingProperty(property.id, patchPayload);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update property.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-black/[0.06] flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">Edit Property Details</h2>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                {property.id} • {property.registration_code || 'Verified Inventory'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Classification */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Property Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g. 4 BHK Ultra-Luxury Sky Villa"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-hidden transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Listing Type</label>
                <select
                  value={formData.listing_type}
                  onChange={(e) => handleInputChange('listing_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
                >
                  <option value="Pre-sales">Pre-sales</option>
                  <option value="Rent">Rent</option>
                  <option value="Re-sale">Re-sale</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Property Category</label>
                <select
                  value={formData.property_category}
                  onChange={(e) => handleInputChange('property_category', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Land & Plot">Land & Plot</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Sub-Category</label>
                <input
                  type="text"
                  value={formData.property_sub_type || ''}
                  onChange={(e) => handleInputChange('property_sub_type', e.target.value)}
                  placeholder="High-Rise Apartments, Villa, Office"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
                />
              </div>
            </div>
          </div>

          {/* Pricing, Area, Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">Price (₹)</label>
                {formData.price && (
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                    {formatPricePreview(Number(formData.price))}
                  </span>
                )}
              </div>
              <input
                type="number"
                value={formData.price ?? ''}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Area (Sq. Ft)</label>
              <input
                type="number"
                value={formData.area ?? ''}
                onChange={(e) => handleInputChange('area', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">BHK / Structure</label>
              <input
                type="text"
                value={formData.bhk || ''}
                onChange={(e) => handleInputChange('bhk', e.target.value)}
                placeholder="3 BHK, 4 BHK, Commercial"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Developer/Owner & Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                {formData.listing_type === 'Pre-sales' ? 'Developer / Brand' : 'Owner / Contact Person'}
              </label>
              <input
                type="text"
                value={formData.developer || formData.owner_name || ''}
                onChange={(e) => {
                  handleInputChange('developer', e.target.value);
                  handleInputChange('owner_name', e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Contact Mobile Number</label>
              <input
                type="tel"
                value={formData.contact_phone || formData.owner_phone || ''}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9]/g, '');
                  handleInputChange('contact_phone', clean);
                  handleInputChange('owner_phone', clean);
                }}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Location & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Locality / Sector</label>
              <input
                type="text"
                value={formData.locality || ''}
                onChange={(e) => handleInputChange('locality', e.target.value)}
                placeholder="SG Highway, Bodakdev, SBR"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Ahmedabad"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Google Maps Link</label>
              <input
                type="url"
                value={formData.location_url || ''}
                onChange={(e) => handleInputChange('location_url', e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Full Address & Landmarks</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Exact project/property address..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
            />
          </div>

          {/* Pre-sales specific fields */}
          {formData.listing_type === 'Pre-sales' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-purple-950">Gujarat RERA Number</label>
                <input
                  type="text"
                  value={formData.rera_number || ''}
                  onChange={(e) => handleInputChange('rera_number', e.target.value)}
                  placeholder="PR/GJ/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-mono text-purple-950 focus:ring-2 focus:ring-purple-200 outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-purple-950">Expected Possession Date</label>
                <input
                  type="text"
                  value={formData.possession_date || ''}
                  onChange={(e) => handleInputChange('possession_date', e.target.value)}
                  placeholder="e.g. December 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-xs text-purple-950 focus:ring-2 focus:ring-purple-200 outline-hidden transition-all"
                />
              </div>
            </div>
          )}

          {/* Media Links: Photos (Up to 100) & Videos (Up to 50) */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>Photos (Comma-separated URLs, up to 100)</span>
                </span>
              </label>
              <textarea
                rows={2}
                value={formData.photos_text || ''}
                onChange={(e) => handleInputChange('photos_text', e.target.value)}
                placeholder="https://images.unsplash.com/..., https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <VideoIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>Videos (Comma-separated video URLs, up to 50)</span>
                </span>
              </label>
              <textarea
                rows={2}
                value={formData.videos_text || ''}
                onChange={(e) => handleInputChange('videos_text', e.target.value)}
                placeholder="https://.../walkthrough.mp4, https://.../drone.mp4"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Amenities & Description */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Amenities (Comma-separated)</label>
              <input
                type="text"
                value={formData.amenities_text || ''}
                onChange={(e) => handleInputChange('amenities_text', e.target.value)}
                placeholder="Clubhouse, Swimming Pool, Gym, EV Bays, 3 Tier Security"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Description</label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Comprehensive project overview and specifications..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-100 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Approval & Live Showcase Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-800">Approval Status:</label>
              <select
                value={formData.approval_status}
                onChange={(e) => handleInputChange('approval_status', e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
              >
                <option value="Approved">Approved</option>
                <option value="Pending">Pending Review</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_published"
                checked={formData.is_published || false}
                onChange={(e) => handleInputChange('is_published', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="edit_is_published" className="text-xs font-bold text-slate-800 cursor-pointer">
                Live on Public Showcase
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-black/[0.06] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-50 transition-all shadow-apple-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
