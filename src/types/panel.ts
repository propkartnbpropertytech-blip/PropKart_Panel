export type FieldType =
  | 'text'
  | 'textarea'
  | 'name'
  | 'phone'
  | 'email'
  | 'number'
  | 'currency'
  | 'area'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'multiselect'
  | 'photos'
  | 'videos'
  | 'google_location'
  | 'direction'
  | 'date'
  | 'time'
  | 'datetime'
  | 'url'
  | 'remarks'
  | 'consent';

export interface FieldOption {
  label: string;
  value: string | number;
}

export interface ValidationRules {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  email?: boolean;
  max_files?: number;
  allowed_types?: string[];
  max_file_size_mb?: number;
  url_required?: boolean;
  required_checked?: boolean;
}

export interface FormField {
  id?: string;
  section_id?: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  placeholder?: string | null;
  help_text?: string | null;
  description?: string | null;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  validation_rules: ValidationRules;
  options: FieldOption[];
  conditional_visibility?: Record<string, any> | null;
}

export interface FormSection {
  id?: string;
  title: string;
  description?: string | null;
  display_order: number;
  fields: FormField[];
}

export interface FormVersion {
  id: string;
  form_id: string;
  version_number: number;
  status: 'draft' | 'published' | 'archived';
  changelog?: string | null;
  published_at?: string | null;
  created_at: string;
}

export interface Form {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  is_active: boolean;
  current_version_id?: string | null;
}

export interface SubmissionMedia {
  id: string;
  submission_id: string;
  field_key: string;
  media_type: 'photo' | 'video' | 'document';
  storage_path: string;
  public_url: string;
  original_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  display_order: number;
  created_at: string;
}

export interface TelecallerNote {
  id: string;
  note: string;
  call_status?: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface AuditLog {
  id: string;
  action: string;
  changes: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface Submission {
  id: string;
  registration_code: string;
  form_id: string;
  version_id: string;
  status:
    | 'New'
    | 'Contact Pending'
    | 'Contacted'
    | 'Details Verified'
    | 'In Progress'
    | 'Converted'
    | 'Not Interested'
    | 'Rejected'
    | 'Archived';
  assigned_to?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  property_type?: string | null;
  listing_type?: string | null;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  location_url?: string | null;
  direction_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  raw_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  } | null;
  media?: {
    id: string;
    media_type: 'photo' | 'video';
    public_url: string;
  }[];
}

export interface SubmissionDetail {
  submission: Submission;
  schema: {
    version: FormVersion;
    sections: FormSection[];
  };
  media: SubmissionMedia[];
  notes: TelecallerNote[];
  audit_logs: AuditLog[];
}

export interface SubmissionStats {
  total: number;
  today: number;
  pending_contact: number;
  contacted: number;
  converted: number;
  photos: number;
  videos: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'Super Admin' | 'Admin' | 'Telecaller' | 'Sales';
}

// ==========================================
// LISTINGS & INVENTORY TYPES (PropKart Sync)
// ==========================================

export type ListingType = 'Rent' | 'Re-sale' | 'Pre-sales';
export type ListingCategory = 'Residential' | 'Commercial' | 'Industrial' | 'Land & Plot';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ListingProperty {
  id: string;
  source?: 'presales_form' | 'propconnect_rent' | 'propconnect_resale' | 'panel_manual';
  submission_id?: string;
  registration_code?: string;
  title: string;
  description?: string;
  listing_type: ListingType;
  property_category: ListingCategory;
  property_sub_type?: string;
  price: number;
  price_display?: string;
  price_unit?: 'month' | 'total' | 'sqft';
  area: number; // in sq.ft
  bhk?: string;
  floor_number?: number | null;
  total_floors?: number | null;
  address?: string;
  locality?: string;
  city: string;
  location_url?: string;
  images: string[];
  videos?: string[];
  is_published: boolean; // Toggle switch: Live on Showcase vs Hidden
  approval_status?: ApprovalStatus; // 'Pending' | 'Approved' | 'Rejected'
  is_approved?: boolean;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
  developer?: string; // Pre-sales specific
  possession_date?: string; // Pre-sales specific
  rera_number?: string; // Pre-sales specific
  owner_name?: string; // Rent/Resale specific
  owner_phone?: string; // Rent/Resale specific
  owner_email?: string;
  contact_person?: string;
  contact_phone?: string;
  amenities?: string[];
  raw_data?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface PreSalesField {
  id?: string;
  field_key: string;
  label: string;
  field_type: 'text' | 'number' | 'dropdown' | 'textarea' | 'date' | 'photos' | 'videos' | 'url' | 'google_location';
  is_required: boolean;
  options?: { label: string; value: string }[] | string;
  placeholder?: string;
  help_text?: string;
}

export interface PreSalesFormSchema {
  id: string;
  title: string;
  version: number;
  fields: PreSalesField[];
  updated_at: string;
}
