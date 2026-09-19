-- PropKart Dynamic Forms & Submissions Schema Migration
-- Designed for Real-time PostgreSQL on Hostinger VPS

BEGIN;

-- 1. Forms Master Table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    current_version_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Form Versions (Immutable schema snapshots)
CREATE TABLE IF NOT EXISTS form_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    changelog TEXT,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(form_id, version_number)
);

-- Foreign key reference from forms.current_version_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_forms_current_version'
    ) THEN
        ALTER TABLE forms
        ADD CONSTRAINT fk_forms_current_version
        FOREIGN KEY (current_version_id) REFERENCES form_versions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Form Sections (Steps / groupings)
CREATE TABLE IF NOT EXISTS form_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES form_versions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Form Fields (Dynamic fields configuration)
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES form_versions(id) ON DELETE CASCADE,
    section_id UUID REFERENCES form_sections(id) ON DELETE SET NULL,
    field_key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    placeholder VARCHAR(255),
    help_text TEXT,
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    validation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    conditional_visibility JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(version_id, field_key)
);

-- 5. Form Submissions
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_code VARCHAR(30) UNIQUE NOT NULL,
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES form_versions(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN (
        'New', 'Contact Pending', 'Contacted', 'Details Verified',
        'In Progress', 'Converted', 'Not Interested', 'Rejected', 'Archived'
    )),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    owner_name VARCHAR(255),
    owner_phone VARCHAR(50),
    owner_email VARCHAR(255),
    property_type VARCHAR(100),
    listing_type VARCHAR(50),
    city VARCHAR(100),
    area VARCHAR(100),
    address TEXT,
    location_url TEXT,
    direction_url TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Submission Media (Stores files metadata & URLs, max 50 photos, max 30 videos)
CREATE TABLE IF NOT EXISTS submission_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    field_key VARCHAR(100) NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('photo', 'video', 'document')),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    original_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Submission Telecaller Notes
CREATE TABLE IF NOT EXISTS submission_telecaller_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    call_status VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Dynamic Forms & Submissions Audit Logs
CREATE TABLE IF NOT EXISTS submission_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES form_submissions(id) ON DELETE CASCADE,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON form_versions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_sections_version_id ON form_sections(version_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_version_id ON form_fields(version_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_section_id ON form_fields(section_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_version_id ON form_submissions(version_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_phone ON form_submissions(owner_phone);
CREATE INDEX IF NOT EXISTS idx_form_submissions_assigned_to ON form_submissions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_form_submissions_reg_code ON form_submissions(registration_code);
CREATE INDEX IF NOT EXISTS idx_submission_media_submission_id ON submission_media(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_notes_submission_id ON submission_telecaller_notes(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_audit_submission_id ON submission_audit_logs(submission_id);

-- GIN Index on JSONB for dynamic field searches
CREATE INDEX IF NOT EXISTS idx_form_submissions_raw_data ON form_submissions USING gin(raw_data);

-- 10. Enable Supabase Realtime publication
DO $$
BEGIN
    ALTER TABLE form_submissions REPLICA IDENTITY FULL;
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'form_submissions'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE form_submissions;
        END IF;
    END IF;
END $$;

-- 11. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_forms_updated_at ON forms;
CREATE TRIGGER trg_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_form_versions_updated_at ON form_versions;
CREATE TRIGGER trg_form_versions_updated_at BEFORE UPDATE ON form_versions FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_form_fields_updated_at ON form_fields;
CREATE TRIGGER trg_form_fields_updated_at BEFORE UPDATE ON form_fields FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER trg_form_submissions_updated_at BEFORE UPDATE ON form_submissions FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

COMMIT;
