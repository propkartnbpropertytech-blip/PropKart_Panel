import { ListingProperty, PreSalesField, Submission, ListingCategory, ListingType } from '../types/panel';

const STORAGE_KEY_LISTINGS = 'propkart_panel_listings_inventory';
const STORAGE_KEY_PRESALES_SCHEMA = 'propkart_panel_presales_schema';
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Zero dummy data: inventory starts strictly clean and syncs from database
export const INITIAL_PROP_KART_INVENTORY: ListingProperty[] = [];

// ==========================================
// DEFAULT PRE-SALES DYNAMIC SCHEMA FIELDS
// ==========================================
export const DEFAULT_PRESALES_FIELDS: PreSalesField[] = [
  {
    field_key: 'project_name',
    label: 'Project / Property Name',
    field_type: 'text',
    is_required: true,
    placeholder: 'e.g. The Grand Solitaire by Adani Realty',
  },
  {
    field_key: 'developer',
    label: 'Developer / Builder Name',
    field_type: 'text',
    is_required: true,
    placeholder: 'e.g. Adani Realty / Godrej Properties',
  },
  {
    field_key: 'property_category',
    label: 'Property Category',
    field_type: 'dropdown',
    is_required: true,
    options: [
      { label: 'Residential', value: 'Residential' },
      { label: 'Commercial', value: 'Commercial' },
      { label: 'Industrial', value: 'Industrial' },
      { label: 'Land & Plot', value: 'Land & Plot' },
    ],
  },
  {
    field_key: 'property_sub_type',
    label: 'Property Sub-type',
    field_type: 'dropdown',
    is_required: true,
    options: [
      { label: 'High-Rise Apartments', value: 'High-Rise Apartments' },
      { label: 'Luxury Villas', value: 'Luxury Villas' },
      { label: 'Penthouse', value: 'Penthouse' },
      { label: 'Corporate Office', value: 'Corporate Office' },
      { label: 'Retail High Street Shop', value: 'Retail High Street Shop' },
      { label: 'Industrial Shed', value: 'Industrial Shed' },
      { label: 'Residential Plot', value: 'Residential Plot' },
    ],
  },
  {
    field_key: 'bhk',
    label: 'Configuration (BHK / Units)',
    field_type: 'dropdown',
    is_required: true,
    options: [
      { label: '1 BHK', value: '1 BHK' },
      { label: '2 BHK', value: '2 BHK' },
      { label: '3 BHK', value: '3 BHK' },
      { label: '4 BHK', value: '4 BHK' },
      { label: '5+ BHK / Penthouse', value: '5+ BHK / Penthouse' },
      { label: 'Commercial Shell Space', value: 'Commercial Shell Space' },
      { label: 'Plot / NA Land', value: 'Plot / NA Land' },
    ],
  },
  {
    field_key: 'price',
    label: 'Starting Price (₹ in Numbers)',
    field_type: 'number',
    is_required: true,
    placeholder: 'e.g. 14500000',
  },
  {
    field_key: 'area',
    label: 'Super Built-up Area (Sq. Ft)',
    field_type: 'number',
    is_required: true,
    placeholder: 'e.g. 2400',
  },
  {
    field_key: 'city',
    label: 'City',
    field_type: 'text',
    is_required: true,
    placeholder: 'e.g. Ahmedabad',
  },
  {
    field_key: 'locality',
    label: 'Locality / Landmark',
    field_type: 'text',
    is_required: true,
    placeholder: 'e.g. SG Highway, Near Nirma University',
  },
  {
    field_key: 'address',
    label: 'Detailed Project Address',
    field_type: 'textarea',
    is_required: false,
    placeholder: 'Full project site address...',
  },
  {
    field_key: 'possession_date',
    label: 'Expected Possession Date',
    field_type: 'text',
    is_required: true,
    placeholder: 'e.g. December 2026 or Mid 2027',
  },
  {
    field_key: 'rera_number',
    label: 'Gujarat RERA Registration Number',
    field_type: 'text',
    is_required: true,
    placeholder: 'e.g. PR/GJ/AHMEDABAD/...',
  },
  {
    field_key: 'location_url',
    label: 'Google Maps Location Link',
    field_type: 'google_location',
    is_required: false,
    placeholder: 'https://maps.google.com/?q=...',
  },
  {
    field_key: 'amenities_text',
    label: 'Key Amenities (comma separated)',
    field_type: 'text',
    is_required: false,
    placeholder: 'Club House, Infinity Pool, Gym, EV Charging',
  },
  {
    field_key: 'description',
    label: 'Project Description & Highlights',
    field_type: 'textarea',
    is_required: true,
    placeholder: 'Describe the pre-sales project features, architecture, and specifications...',
  },
  {
    field_key: 'photos',
    label: 'Project Elevation & Sample Photos (URLs comma-separated or upload)',
    field_type: 'photos',
    is_required: true,
    placeholder: 'Paste image URLs or select files',
  },
];

// ==========================================
// LOCAL STORAGE & REMOTE SERVICE
// ==========================================

export function getLocalListings(): ListingProperty[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LISTINGS);
    if (!raw) {
      return [];
    }
    const parsed: ListingProperty[] = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any legacy mock items
      return parsed.filter(
        (p) =>
          !p.id.startsWith('prop-rent-res-') &&
          !p.id.startsWith('prop-presale-01') &&
          !p.id.startsWith('prop-presale-02') &&
          !p.id.startsWith('prop-presale-03') &&
          !p.id.startsWith('prop-sale-res-') &&
          !p.id.startsWith('prop-rent-comm-') &&
          !p.id.startsWith('prop-sale-comm-') &&
          !p.id.startsWith('prop-rent-ind-') &&
          !p.id.startsWith('prop-sale-ind-') &&
          !p.id.startsWith('prop-plot-')
      );
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function saveLocalListings(listings: ListingProperty[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(listings));
  } catch (e) {
    console.warn('Failed to save listings to localStorage', e);
  }
}

/**
 * Fetch all properties from backend or local cache
 */
export async function fetchListings(): Promise<ListingProperty[]> {
  const endpoints = [
    `${BASE_URL}/admin/listings`,
    `${BASE_URL}/listings/all`,
    'http://localhost:5050/api/v1/admin/listings',
    'http://localhost:5050/api/v1/listings/all',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          // Clean legacy mock items
          const cleaned = json.data.filter(
            (p: ListingProperty) =>
              !p.id.startsWith('prop-rent-res-') &&
              !p.id.startsWith('prop-presale-01') &&
              !p.id.startsWith('prop-presale-02') &&
              !p.id.startsWith('prop-presale-03') &&
              !p.id.startsWith('prop-sale-res-') &&
              !p.id.startsWith('prop-rent-comm-') &&
              !p.id.startsWith('prop-sale-comm-') &&
              !p.id.startsWith('prop-rent-ind-') &&
              !p.id.startsWith('prop-sale-ind-') &&
              !p.id.startsWith('prop-plot-')
          );
          saveLocalListings(cleaned);
          return cleaned;
        }
      }
    } catch (err) {}
  }

  return getLocalListings();
}

/**
 * Approve a property listing in Panel
 */
export async function approveListingProperty(
  id: string,
  isPublished = true
): Promise<ListingProperty> {
  const current = getLocalListings();
  const index = current.findIndex((p) => p.id === id);
  if (index !== -1) {
    current[index] = {
      ...current[index],
      approval_status: 'Approved',
      is_approved: true,
      is_published: isPublished,
      approved_at: new Date().toISOString(),
      approved_by: 'Operations Desk',
      updated_at: new Date().toISOString(),
    };
    saveLocalListings(current);
  }

  // Broadcast to other tabs (Listing app & PreSales app)
  try {
    const channel = new BroadcastChannel('propkart_listing_channel');
    channel.postMessage({
      type: 'LISTING_APPROVED',
      id,
      is_published: isPublished,
    });
    channel.close();
  } catch (e) {}

  // Sync to backend endpoints
  const endpoints = [
    `${BASE_URL}/admin/listings/${id}/approve`,
    `${BASE_URL}/listings/${id}/approve`,
    `http://localhost:5050/api/v1/admin/listings/${id}/approve`,
    `http://localhost:5050/api/v1/listings/${id}/approve`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
        },
        body: JSON.stringify({ is_published: isPublished }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {}
  }

  if (index !== -1) return current[index];
  throw new Error('Property not found');
}

/**
 * Reject a property listing in Panel
 */
export async function rejectListingProperty(
  id: string,
  reason = 'Does not meet verification criteria'
): Promise<ListingProperty> {
  const current = getLocalListings();
  const index = current.findIndex((p) => p.id === id);
  if (index !== -1) {
    current[index] = {
      ...current[index],
      approval_status: 'Rejected',
      is_approved: false,
      is_published: false,
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    };
    saveLocalListings(current);
  }

  try {
    const channel = new BroadcastChannel('propkart_listing_channel');
    channel.postMessage({
      type: 'LISTING_REJECTED',
      id,
      reason,
    });
    channel.close();
  } catch (e) {}

  const endpoints = [
    `${BASE_URL}/admin/listings/${id}/reject`,
    `${BASE_URL}/listings/${id}/reject`,
    `http://localhost:5050/api/v1/admin/listings/${id}/reject`,
    `http://localhost:5050/api/v1/listings/${id}/reject`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {}
  }

  if (index !== -1) return current[index];
  throw new Error('Property not found');
}

/**
 * Toggle visibility on Public Showcase (requires property to be approved)
 */
export async function togglePropertyPublish(id: string): Promise<ListingProperty> {
  const current = getLocalListings();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Property not found');

  const target = current[index];
  const newPublishState = !target.is_published;

  if (newPublishState && !target.is_approved) {
    throw new Error('Cannot show on web: Property must be approved by Operations Desk first.');
  }

  const updatedProperty = {
    ...target,
    is_published: newPublishState,
    updated_at: new Date().toISOString(),
  };

  current[index] = updatedProperty;
  saveLocalListings(current);

  // Broadcast to Listing & Pre-sales tabs
  try {
    const channel = new BroadcastChannel('propkart_listing_channel');
    channel.postMessage({
      type: 'LISTING_TOGGLED',
      id: updatedProperty.id,
      is_published: updatedProperty.is_published,
      updated_at: updatedProperty.updated_at,
    });
    channel.close();
  } catch (e) {}

  const endpoints = [
    `${BASE_URL}/admin/listings/${id}/toggle`,
    `${BASE_URL}/listings/${id}/toggle`,
    `http://localhost:5050/api/v1/admin/listings/${id}/toggle`,
    `http://localhost:5050/api/v1/listings/${id}/toggle`,
  ];

  for (const url of endpoints) {
    try {
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
        },
        body: JSON.stringify({ is_published: updatedProperty.is_published }),
      }).catch(() => {});
    } catch (e) {}
  }

  return updatedProperty;
}

/**
 * Trigger sync of all submissions from database into the listings store
 */
export async function syncDatabaseSubmissions(): Promise<ListingProperty[]> {
  const endpoints = [
    `${BASE_URL}/admin/listings/sync-submissions`,
    `${BASE_URL}/listings/sync-submissions`,
    'http://localhost:5050/api/v1/admin/listings/sync-submissions',
    'http://localhost:5050/api/v1/listings/sync-submissions',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          saveLocalListings(json.data);
          return json.data;
        }
      }
    } catch (e) {}
  }

  return fetchListings();
}

/**
 * Add Pre-sales property from Panel
 */
export async function addPreSalesProperty(
  rawFormData: Record<string, any>
): Promise<ListingProperty> {
  const current = getLocalListings();

  const rawPrice = Number(rawFormData.price) || 0;
  let priceDisplay = `₹ ${rawPrice.toLocaleString('en-IN')}`;
  if (rawPrice >= 10000000) {
    priceDisplay = `₹ ${(rawPrice / 10000000).toFixed(2)} Cr onwards`;
  } else if (rawPrice >= 100000) {
    priceDisplay = `₹ ${(rawPrice / 100000).toFixed(2)} Lakhs onwards`;
  }

  const amenitiesList =
    typeof rawFormData.amenities_text === 'string'
      ? rawFormData.amenities_text.split(',').map((s: string) => s.trim()).filter(Boolean)
      : ['RERA Approved', 'Clubhouse', 'Modern Elevation'];

  let imageList: string[] = [];
  if (typeof rawFormData.photos === 'string' && rawFormData.photos.trim()) {
    imageList = rawFormData.photos.split(',').map((u: string) => u.trim()).filter(Boolean);
  } else if (Array.isArray(rawFormData.photos)) {
    imageList = rawFormData.photos;
  }
  if (imageList.length === 0) {
    imageList = ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80'];
  }

  // Pre-sales added in panel can be approved directly or marked pending
  const isApproved = rawFormData.is_approved !== false;
  const isPublished = isApproved && rawFormData.is_published !== false;

  const newProperty: ListingProperty = {
    id: `prop-presale-${Date.now()}`,
    source: 'panel_manual',
    title: rawFormData.project_name || 'Upcoming Premium Pre-sales Project',
    description: rawFormData.description || 'Exclusive upcoming project with state-of-the-art amenities.',
    listing_type: 'Pre-sales',
    property_category: rawFormData.property_category || 'Residential',
    property_sub_type: rawFormData.property_sub_type || 'High-Rise Apartments',
    price: rawPrice,
    price_display: priceDisplay,
    price_unit: 'total',
    area: Number(rawFormData.area) || 1800,
    bhk: rawFormData.bhk || '3 BHK',
    developer: rawFormData.developer || 'PropKart Verified Builder',
    possession_date: rawFormData.possession_date || 'Launching Soon',
    rera_number: rawFormData.rera_number || 'Applied / In Process',
    address: rawFormData.address || rawFormData.locality,
    locality: rawFormData.locality || 'Prime Locality',
    city: rawFormData.city || 'Ahmedabad',
    location_url: rawFormData.location_url || '',
    images: imageList,
    approval_status: isApproved ? 'Approved' : 'Pending',
    is_approved: isApproved,
    is_published: isPublished,
    amenities: amenitiesList,
    raw_data: rawFormData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  current.unshift(newProperty);
  saveLocalListings(current);

  try {
    const channel = new BroadcastChannel('propkart_listing_channel');
    channel.postMessage({ type: 'INVENTORY_UPDATED', action: 'added', property: newProperty });
    channel.close();
  } catch (e) {}

  const endpoints = [
    `${BASE_URL}/admin/listings/presales`,
    `${BASE_URL}/listings/presales`,
    'http://localhost:5050/api/v1/admin/listings/presales',
    'http://localhost:5050/api/v1/listings/presales',
  ];

  for (const url of endpoints) {
    try {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
        },
        body: JSON.stringify(newProperty),
      }).catch(() => {});
    } catch (e) {}
  }

  return newProperty;
}

/**
 * Update an existing property listing (CRUD: Update)
 */
export async function updateListingProperty(
  id: string,
  updates: Partial<ListingProperty>
): Promise<ListingProperty> {
  const current = getLocalListings();
  const index = current.findIndex((p) => p.id === id);
  if (index !== -1) {
    current[index] = {
      ...current[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalListings(current);
  }

  // Broadcast update to all connected tabs
  try {
    const channel = new BroadcastChannel('propkart_listing_channel');
    channel.postMessage({
      type: 'INVENTORY_UPDATED',
      action: 'updated',
      id,
      property: current[index],
    });
    channel.close();
  } catch (e) {}

  const endpoints = [
    `${BASE_URL}/listings/${id}`,
    `${BASE_URL}/admin/listings/${id}`,
    `http://localhost:5050/api/v1/listings/${id}`,
    `http://localhost:5050/api/v1/admin/listings/${id}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {}
  }

  if (index !== -1) return current[index];
  throw new Error('Property not found');
}

/**
 * Delete a property listing (CRUD: Delete)
 */
export async function deleteListingProperty(id: string): Promise<void> {
  const current = getLocalListings();
  const filtered = current.filter((p) => p.id !== id);
  saveLocalListings(filtered);

  // Broadcast deletion to all open tabs
  try {
    const channel = new BroadcastChannel('propkart_listing_channel');
    channel.postMessage({ type: 'INVENTORY_UPDATED', action: 'deleted', id });
    channel.close();
  } catch (e) {}

  const endpoints = [
    `${BASE_URL}/listings/${id}`,
    `${BASE_URL}/admin/listings/${id}`,
    `http://localhost:5050/api/v1/listings/${id}`,
    `http://localhost:5050/api/v1/admin/listings/${id}`,
  ];

  let serverDeleted = false;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
        },
      });
      if (res.ok) {
        serverDeleted = true;
        break;
      }
    } catch (e) {}
  }
}

// ==========================================
// PRE-SALES FORM SCHEMA MANAGEMENT
// ==========================================

export function getLocalPreSalesSchema(): PreSalesField[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRESALES_SCHEMA);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PRESALES_SCHEMA, JSON.stringify(DEFAULT_PRESALES_FIELDS));
      return DEFAULT_PRESALES_FIELDS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_PRESALES_FIELDS;
  }
}

export function saveLocalPreSalesSchema(fields: PreSalesField[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PRESALES_SCHEMA, JSON.stringify(fields));
  } catch (e) {
    console.warn('Failed to save presales schema', e);
  }
}

export async function fetchPreSalesSchema(): Promise<PreSalesField[]> {
  try {
    const res = await fetch(`${BASE_URL}/admin/forms/presales-schema`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data?.fields) && json.data.fields.length > 0) {
        saveLocalPreSalesSchema(json.data.fields);
        return json.data.fields;
      }
    }
  } catch (e) {}
  return getLocalPreSalesSchema();
}

export async function savePreSalesSchema(fields: PreSalesField[]): Promise<void> {
  saveLocalPreSalesSchema(fields);
  try {
    fetch(`${BASE_URL}/admin/forms/presales-schema`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
      },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch (e) {}
}

export function resetPreSalesSchema(): PreSalesField[] {
  saveLocalPreSalesSchema(DEFAULT_PRESALES_FIELDS);
  return DEFAULT_PRESALES_FIELDS;
}

// ==========================================
// PROPERTY POOL -> LISTING SHOWCASE BRIDGE
// ==========================================

export interface SubmissionListingInfo {
  isListed: boolean;
  isPublished: boolean;
  isApproved: boolean;
  listingId?: string;
  listing?: ListingProperty;
}

/**
 * Check if a submission is currently listed and published on the Listing showcase
 */
export function getSubmissionListingInfo(
  submissionId: string,
  registrationCode?: string
): SubmissionListingInfo {
  const listings = getLocalListings();
  const match = listings.find(
    (p) =>
      p.submission_id === submissionId ||
      p.id === `prop-sub-${submissionId}` ||
      (registrationCode && p.registration_code === registrationCode)
  );

  if (!match) {
    return { isListed: false, isPublished: false, isApproved: false };
  }

  return {
    isListed: true,
    isPublished: !!match.is_published,
    isApproved: !!match.is_approved || match.approval_status === 'Approved',
    listingId: match.id,
    listing: match,
  };
}

/**
 * Convert and publish a submission from Property Pool directly to the Listing showcase
 */
export async function publishSubmissionToListing(
  submission: Submission,
  shouldPublish = true
): Promise<ListingProperty> {
  const current = getLocalListings();
  const subId = submission.id;
  const existingIdx = current.findIndex(
    (p) =>
      p.submission_id === subId ||
      p.id === `prop-sub-${subId}` ||
      (submission.registration_code && p.registration_code === submission.registration_code)
  );

  const raw = submission.raw_data || {};

  // Extract contact & location
  const ownerName = submission.owner_name || raw.owner_name || raw.name || 'Property Owner';
  const ownerPhone = submission.owner_phone || raw.owner_phone || raw.mobile || raw.phone || '';
  const ownerEmail = submission.owner_email || raw.owner_email || raw.email || '';
  const address = submission.address || raw.address || raw.society_name || '';
  const locality = submission.area || raw.area || raw.locality || raw.society_name || 'Prime Locality';
  const city = submission.city || raw.city || 'Ahmedabad';
  const locationUrl = submission.location_url || raw.location_url || raw.direction_url || '';

  // Determine transaction type (Rent vs Re-sale)
  const rawType = (
    submission.listing_type ||
    raw.property_for_rent_or_sale ||
    raw.listing_type ||
    raw.rent_or_sale ||
    raw.purpose ||
    ''
  ).toLowerCase();
  const listingType: ListingType = rawType.includes('rent') ? 'Rent' : 'Re-sale';

  // Determine category
  let category: ListingCategory = 'Residential';
  const rawCat = (
    submission.property_type ||
    raw.property_type ||
    raw.property_category ||
    raw.category ||
    ''
  ).toLowerCase();
  if (rawCat.includes('comm') || rawCat.includes('office') || rawCat.includes('shop') || rawCat.includes('showroom')) {
    category = 'Commercial';
  } else if (rawCat.includes('indus') || rawCat.includes('shed') || rawCat.includes('ware') || rawCat.includes('factory')) {
    category = 'Industrial';
  } else if (rawCat.includes('plot') || rawCat.includes('land') || rawCat.includes('agriculture')) {
    category = 'Land & Plot';
  }

  // Price formatting
  const rawPrice = Number(
    raw.expected_price ||
    raw.expected_rent ||
    raw.rent ||
    raw.price ||
    0
  );
  let priceDisplay = `₹ ${rawPrice.toLocaleString('en-IN')}`;
  if (listingType === 'Rent') {
    priceDisplay = `₹ ${rawPrice.toLocaleString('en-IN')} / month`;
  } else if (rawPrice >= 10000000) {
    priceDisplay = `₹ ${(rawPrice / 10000000).toFixed(2)} Cr`;
  } else if (rawPrice >= 100000) {
    priceDisplay = `₹ ${(rawPrice / 100000).toFixed(2)} Lakhs`;
  }

  // Area & BHK
  const area = Number(
    raw.built_up_area ||
    raw.super_built_up_area ||
    raw.plot_area ||
    raw.area ||
    1200
  );
  const bhk = raw.bhk || raw.configuration || (category === 'Residential' ? '3 BHK' : 'Commercial Unit');

  // Media
  let imageList: string[] = [];
  let videoList: string[] = [];
  if (Array.isArray(submission.media) && submission.media.length > 0) {
    imageList = submission.media
      .filter((m) => m.media_type === 'photo')
      .map((m) => m.public_url || (m as any).storage_path)
      .filter(Boolean);
    videoList = submission.media
      .filter((m) => m.media_type === 'video')
      .map((m) => m.public_url || (m as any).storage_path)
      .filter(Boolean);
  }
  if (imageList.length === 0) {
    imageList = [
      listingType === 'Rent'
        ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
        : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
    ];
  }

  const title = raw.title || `${bhk} ${category} in ${locality}, ${city}`;
  const description =
    raw.description ||
    address ||
    `Verified direct-owner ${listingType} property submitted via PropConnect. Complete verified title & direct owner contact.`;

  const listingItem: ListingProperty = {
    id: existingIdx !== -1 ? current[existingIdx].id : `prop-sub-${subId}`,
    submission_id: subId,
    registration_code: submission.registration_code,
    source: listingType === 'Rent' ? 'propconnect_rent' : 'propconnect_resale',
    title,
    description,
    listing_type: listingType,
    property_category: category,
    property_sub_type: submission.property_type || 'Apartment',
    price: rawPrice,
    price_display: priceDisplay,
    price_unit: listingType === 'Rent' ? 'month' : 'total',
    area,
    bhk,
    address,
    locality,
    city,
    location_url: locationUrl,
    images: imageList,
    videos: videoList,
    owner_name: ownerName,
    owner_phone: ownerPhone,
    owner_email: ownerEmail,
    approval_status: 'Approved',
    is_approved: true,
    is_published: shouldPublish,
    approved_at: new Date().toISOString(),
    approved_by: 'Property Pool Desk',
    amenities: ['Verified Direct Owner', 'PropConnect Certified'],
    raw_data: raw,
    created_at: submission.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    current[existingIdx] = listingItem;
  } else {
    current.unshift(listingItem);
  }

  saveLocalListings(current);

  // Broadcast to all open tabs: Listing portal (3004) & Panel
  try {
    const channel = new BroadcastChannel('propkart_listing_channel');
    channel.postMessage({
      type: 'INVENTORY_UPDATED',
      action: existingIdx !== -1 ? 'updated' : 'added',
      id: listingItem.id,
      property: listingItem,
    });
    channel.postMessage({
      type: 'LISTING_APPROVED',
      id: listingItem.id,
      is_published: shouldPublish,
    });
    channel.postMessage({
      type: 'LISTING_TOGGLED',
      id: listingItem.id,
      is_published: shouldPublish,
    });
    channel.close();
  } catch (e) {}

  // Sync to backend endpoints
  const endpoints = [
    `${BASE_URL}/listings/publish-submission/${subId}`,
    `${BASE_URL}/admin/listings/publish-submission/${subId}`,
    `http://localhost:5050/api/v1/listings/publish-submission/${subId}`,
    `http://localhost:5050/api/v1/admin/listings/publish-submission/${subId}`,
    `${BASE_URL}/listings/${listingItem.id}/approve`,
    `http://localhost:5050/api/v1/listings/${listingItem.id}/approve`,
  ];

  for (const url of endpoints) {
    try {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('propkart_panel_token') || ''}`,
        },
        body: JSON.stringify({ is_published: shouldPublish, listing: listingItem }),
      }).catch(() => {});
    } catch (e) {}
  }

  return listingItem;
}

/**
 * Toggle listing publication status for a submission
 */
export async function toggleSubmissionListing(submission: Submission): Promise<ListingProperty> {
  const info = getSubmissionListingInfo(submission.id, submission.registration_code);
  const nextPublishState = !info.isPublished;
  return publishSubmissionToListing(submission, nextPublishState);
}

/**
 * Bulk publish multiple submissions to listing showcase
 */
export async function bulkPublishSubmissionsToListing(
  submissions: Submission[],
  shouldPublish = true
): Promise<ListingProperty[]> {
  const results: ListingProperty[] = [];
  for (const sub of submissions) {
    try {
      const res = await publishSubmissionToListing(sub, shouldPublish);
      results.push(res);
    } catch (e) {
      console.warn('Failed to publish submission:', sub.id, e);
    }
  }
  return results;
}
