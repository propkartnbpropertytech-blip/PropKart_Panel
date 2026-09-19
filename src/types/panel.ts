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
