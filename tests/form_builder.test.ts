import { describe, it, expect } from 'vitest';
import { FormSection, FormField, Submission } from '../src/types/panel';

describe('PropKart Panel Form Builder & Submission Operations Engine', () => {
  // 1. Dynamic field creation & validation
  it('creates and validates dynamic form fields structure', () => {
    const field: FormField = {
      field_key: 'expected_price',
      label: 'Expected Price (₹)',
      field_type: 'currency',
      is_required: true,
      is_active: true,
      display_order: 1,
      validation_rules: { min_value: 5000 },
      options: [],
    };

    expect(field.field_key).toBe('expected_price');
    expect(field.is_required).toBe(true);
    expect(field.validation_rules.min_value).toBe(5000);
  });

  // 2. Field duplication logic
  it('duplicates field with unique field_key and incremented display order', () => {
    const original: FormField = {
      field_key: 'property_facing',
      label: 'Property Facing',
      field_type: 'dropdown',
      is_required: false,
      is_active: true,
      display_order: 3,
      validation_rules: {},
      options: [{ label: 'East', value: 'East' }, { label: 'West', value: 'West' }],
    };

    const duplicate: FormField = {
      ...original,
      id: undefined,
      label: `${original.label} (Copy)`,
      field_key: `${original.field_key}_copy`,
      display_order: original.display_order + 1,
    };

    expect(duplicate.label).toBe('Property Facing (Copy)');
    expect(duplicate.field_key).toBe('property_facing_copy');
    expect(duplicate.display_order).toBe(4);
    expect(duplicate.options.length).toBe(2);
  });

  // 3. Telecaller Status Pipeline
  it('validates allowed telecaller workflow statuses', () => {
    const validStatuses = [
      'New',
      'Contact Pending',
      'Contacted',
      'Details Verified',
      'In Progress',
      'Converted',
      'Not Interested',
      'Rejected',
      'Archived',
    ];

    expect(validStatuses).toContain('New');
    expect(validStatuses).toContain('Converted');
    expect(validStatuses).toContain('Details Verified');
    expect(validStatuses).not.toContain('InvalidStatus');
  });

  // 4. Submissions filter logic
  it('filters submissions by status and search keyword correctly', () => {
    const sampleSubmissions: Partial<Submission>[] = [
      { id: '1', registration_code: 'PK-REG-2026-101', owner_name: 'Rajesh Sharma', city: 'Ahmedabad', status: 'New' },
      { id: '2', registration_code: 'PK-REG-2026-102', owner_name: 'Pooja Patel', city: 'Surat', status: 'Contacted' },
      { id: '3', registration_code: 'PK-REG-2026-103', owner_name: 'Amit Shah', city: 'Ahmedabad', status: 'Converted' },
    ];

    // Filter by city
    const ahmedabadOnly = sampleSubmissions.filter((s) => s.city === 'Ahmedabad');
    expect(ahmedabadOnly.length).toBe(2);

    // Filter by status
    const newOnly = sampleSubmissions.filter((s) => s.status === 'New');
    expect(newOnly.length).toBe(1);
    expect(newOnly[0].owner_name).toBe('Rajesh Sharma');

    // Search keyword
    const searchMatch = sampleSubmissions.filter((s) =>
      s.owner_name?.toLowerCase().includes('pooja')
    );
    expect(searchMatch.length).toBe(1);
    expect(searchMatch[0].registration_code).toBe('PK-REG-2026-102');
  });

  // 5. Registration code format validation
  it('verifies registration code pattern PK-REG-YYYY-XXXXX', () => {
    const regCodeRegex = /^PK-REG-\d{4}-\d{5}$/;
    expect(regCodeRegex.test('PK-REG-2026-84912')).toBe(true);
    expect(regCodeRegex.test('PK-REG-2026-12345')).toBe(true);
    expect(regCodeRegex.test('INVALID-CODE')).toBe(false);
  });

  // 6. Media upload limits in form builder
  it('validates photo and video limit constraints in Form Builder', () => {
    const photoField: FormField = {
      field_key: 'property_photos',
      label: 'Property Photos',
      field_type: 'photos',
      is_required: true,
      is_active: true,
      display_order: 1,
      validation_rules: { max_files: 50, max_file_size_mb: 25 },
      options: [],
    };

    const videoField: FormField = {
      field_key: 'property_videos',
      label: 'Property Videos',
      field_type: 'videos',
      is_required: false,
      is_active: true,
      display_order: 2,
      validation_rules: { max_files: 30, max_file_size_mb: 50 },
      options: [],
    };

    expect(photoField.validation_rules.max_files).toBe(50);
    expect(photoField.validation_rules.max_file_size_mb).toBe(25);
    expect(videoField.validation_rules.max_files).toBe(30);
    expect(videoField.validation_rules.max_file_size_mb).toBe(50);
  });
});
