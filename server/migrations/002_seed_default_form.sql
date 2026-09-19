-- Seed Initial Published Form: Instant Property Registration (v1)
BEGIN;

DO $$
DECLARE
    v_form_id UUID;
    v_version_id UUID;
    v_sec_owner UUID;
    v_sec_property UUID;
    v_sec_location UUID;
    v_sec_amenities UUID;
    v_sec_media UUID;
    v_sec_consent UUID;
BEGIN
    -- Check if form already exists
    SELECT id INTO v_form_id FROM forms WHERE slug = 'property-registration';
    
    IF v_form_id IS NULL THEN
        -- Insert Master Form
        INSERT INTO forms (slug, title, description, is_active)
        VALUES (
            'property-registration',
            'Instant Property Registration',
            'Official PropKart property registration form. Register your property in a few simple steps.',
            true
        )
        RETURNING id INTO v_form_id;

        -- Insert Version 1 (Published)
        INSERT INTO form_versions (form_id, version_number, status, changelog, published_at)
        VALUES (
            v_form_id,
            1,
            'published',
            'Initial production release with dynamic field builder support',
            now()
        )
        RETURNING id INTO v_version_id;

        -- Link current_version_id
        UPDATE forms SET current_version_id = v_version_id WHERE id = v_form_id;

        -- Insert Sections
        INSERT INTO form_sections (version_id, title, description, display_order)
        VALUES (v_version_id, 'Owner Details', 'Please provide your contact information so our property experts can connect with you.', 1)
        RETURNING id INTO v_sec_owner;

        INSERT INTO form_sections (version_id, title, description, display_order)
        VALUES (v_version_id, 'Property Details', 'Specify key features and financial details of your property.', 2)
        RETURNING id INTO v_sec_property;

        INSERT INTO form_sections (version_id, title, description, display_order)
        VALUES (v_version_id, 'Property Location', 'Accurate location and directions help buyers visit your property quickly.', 3)
        RETURNING id INTO v_sec_location;

        INSERT INTO form_sections (version_id, title, description, display_order)
        VALUES (v_version_id, 'Features & Amenities', 'Select furnishings, facing, and facilities available.', 4)
        RETURNING id INTO v_sec_amenities;

        INSERT INTO form_sections (version_id, title, description, display_order)
        VALUES (v_version_id, 'Photos & Videos', 'Upload high-resolution property media. Up to 50 photos and 30 videos supported.', 5)
        RETURNING id INTO v_sec_media;

        INSERT INTO form_sections (version_id, title, description, display_order)
        VALUES (v_version_id, 'Review & Consent', 'Final remarks and owner declaration.', 6)
        RETURNING id INTO v_sec_consent;

        -- Insert Section 1 Fields (Owner Details)
        INSERT INTO form_fields (version_id, section_id, field_key, label, field_type, placeholder, help_text, is_required, is_active, display_order, validation_rules)
        VALUES 
        (v_version_id, v_sec_owner, 'owner_name', 'Full Name', 'name', 'e.g. Rajesh Sharma', 'Enter your full legal name or organization name', true, true, 1, '{"min_length": 3, "max_length": 100}'::jsonb),
        (v_version_id, v_sec_owner, 'owner_phone', 'Mobile Number', 'phone', 'e.g. 9876543210', 'Enter a 10-digit Indian mobile number for verification', true, true, 2, '{"pattern": "^[6-9][0-9]{9}$"}'::jsonb),
        (v_version_id, v_sec_owner, 'owner_email', 'Email Address', 'email', 'e.g. rajesh@example.com', 'We will send registration confirmation to this address', false, true, 3, '{"email": true}'::jsonb),
        (v_version_id, v_sec_owner, 'alternate_phone', 'Alternative Phone / WhatsApp', 'phone', 'e.g. 9823456789', 'Optional backup number for WhatsApp updates', false, true, 4, '{"pattern": "^[6-9][0-9]{9}$"}'::jsonb);

        -- Insert Section 2 Fields (Property Details)
        INSERT INTO form_fields (version_id, section_id, field_key, label, field_type, placeholder, help_text, is_required, is_active, display_order, validation_rules, options)
        VALUES
        (v_version_id, v_sec_property, 'property_type', 'Property Type', 'dropdown', 'Select property type', 'Type of property you want to register', true, true, 1, '{}'::jsonb, 
         '[{"label": "Apartment / Flat", "value": "Apartment"}, {"label": "Independent House / Villa", "value": "Villa"}, {"label": "Commercial Office", "value": "Commercial Office"}, {"label": "Retail Shop / Showroom", "value": "Retail Shop"}, {"label": "Plot / Land", "value": "Plot / Land"}, {"label": "Industrial / Warehouse", "value": "Industrial"}]'::jsonb),
        
        (v_version_id, v_sec_property, 'listing_type', 'Listing Type', 'radio', '', 'Do you want to sell or rent out this property?', true, true, 2, '{}'::jsonb,
         '[{"label": "Sell / Resale", "value": "Sell"}, {"label": "Rent / Lease", "value": "Rent"}]'::jsonb),

        (v_version_id, v_sec_property, 'bhk', 'Configuration / BHK', 'dropdown', 'Select BHK', 'Number of bedrooms or space configuration', true, true, 3, '{}'::jsonb,
         '[{"label": "1 RK", "value": "1 RK"}, {"label": "1 BHK", "value": "1 BHK"}, {"label": "2 BHK", "value": "2 BHK"}, {"label": "3 BHK", "value": "3 BHK"}, {"label": "4 BHK", "value": "4 BHK"}, {"label": "5+ BHK", "value": "5+ BHK"}, {"label": "Commercial Hall", "value": "Commercial Hall"}, {"label": "Other", "value": "Other"}]'::jsonb),

        (v_version_id, v_sec_property, 'built_up_area', 'Super Built-up Area (Sq. Ft)', 'area', 'e.g. 1450', 'Total area in square feet', true, true, 4, '{"min_value": 50, "max_value": 500000}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_property, 'expected_price', 'Expected Price / Monthly Rent (₹)', 'currency', 'e.g. 7500000', 'Total price in ₹ for sale or monthly rent in ₹', true, true, 5, '{"min_value": 1000}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_property, 'floor_number', 'Property Floor', 'number', 'e.g. 4', 'Which floor is the property on? (0 for Ground)', false, true, 6, '{"min_value": 0, "max_value": 150}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_property, 'total_floors', 'Total Floors in Building', 'number', 'e.g. 14', 'Total floors in the building/tower', false, true, 7, '{"min_value": 1, "max_value": 150}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_property, 'maintenance_amount', 'Maintenance Charges (₹ / Month)', 'currency', 'e.g. 3500', 'Monthly maintenance payable, if any', false, true, 8, '{}'::jsonb, '[]'::jsonb);

        -- Insert Section 3 Fields (Location & Direction)
        INSERT INTO form_fields (version_id, section_id, field_key, label, field_type, placeholder, help_text, is_required, is_active, display_order, validation_rules, options)
        VALUES
        (v_version_id, v_sec_location, 'address', 'Address / Society Name', 'textarea', 'e.g. Flat 402, Shivalik Highstreet, Opposite Iscon Mega Mall', 'Full address of the property', true, true, 1, '{"min_length": 10, "max_length": 500}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_location, 'city', 'City', 'dropdown', 'Select City', 'City where property is situated', true, true, 2, '{}'::jsonb,
         '[{"label": "Ahmedabad", "value": "Ahmedabad"}, {"label": "Surat", "value": "Surat"}, {"label": "Vadodara", "value": "Vadodara"}, {"label": "Rajkot", "value": "Rajkot"}, {"label": "Gandhinagar", "value": "Gandhinagar"}, {"label": "Mumbai", "value": "Mumbai"}, {"label": "Pune", "value": "Pune"}, {"label": "Bangalore", "value": "Bangalore"}, {"label": "Other", "value": "Other"}]'::jsonb),

        (v_version_id, v_sec_location, 'area', 'Area / Locality', 'text', 'e.g. Prahladnagar, SG Highway, Bodakdev', 'Locality or prominent sub-area', true, true, 3, '{"min_length": 3}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_location, 'pincode', 'Pincode', 'number', 'e.g. 380015', '6-digit postal code', false, true, 4, '{"min_value": 100000, "max_value": 999999}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_location, 'google_location', 'Google Maps Location & Link', 'google_location', 'Pin your location on Google Maps or paste Google Maps URL', 'Allows telecallers and buyers to navigate directly to your property', true, true, 5, '{"url_required": true}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_location, 'direction', 'Direction & Navigation Landmark', 'direction', 'e.g. Behind Reliance Fresh, 2nd building from Main Gate, or navigation URL', 'Clear directions or landmark instructions to locate the property easily', true, true, 6, '{"min_length": 5}'::jsonb, '[]'::jsonb);

        -- Insert Section 4 Fields (Features & Amenities)
        INSERT INTO form_fields (version_id, section_id, field_key, label, field_type, placeholder, help_text, is_required, is_active, display_order, validation_rules, options)
        VALUES
        (v_version_id, v_sec_amenities, 'furnishing', 'Furnishing Status', 'radio', '', 'Select current furnishing level', true, true, 1, '{}'::jsonb,
         '[{"label": "Unfurnished", "value": "Unfurnished"}, {"label": "Semi-Furnished", "value": "Semi-Furnished"}, {"label": "Fully-Furnished", "value": "Fully-Furnished"}]'::jsonb),

        (v_version_id, v_sec_amenities, 'facing', 'Property Facing', 'dropdown', 'Select facing', 'Main entrance facing direction (Vastu)', false, true, 2, '{}'::jsonb,
         '[{"label": "East", "value": "East"}, {"label": "North", "value": "North"}, {"label": "North-East", "value": "North-East"}, {"label": "West", "value": "West"}, {"label": "South", "value": "South"}, {"label": "North-West", "value": "North-West"}, {"label": "South-East", "value": "South-East"}, {"label": "South-West", "value": "South-West"}]'::jsonb),

        (v_version_id, v_sec_amenities, 'parking', 'Reserved Parking', 'dropdown', 'Select parking', 'Available vehicle parking slots', false, true, 3, '{}'::jsonb,
         '[{"label": "None", "value": "None"}, {"label": "1 Covered Car", "value": "1 Covered"}, {"label": "2 Covered Cars", "value": "2 Covered"}, {"label": "Open Parking", "value": "Open"}, {"label": "Covered + Open", "value": "Multiple"}]'::jsonb),

        (v_version_id, v_sec_amenities, 'amenities', 'Available Amenities', 'multiselect', 'Select amenities', 'Check all amenities available in the building or society', false, true, 4, '{}'::jsonb,
         '[{"label": "Elevator / Lift", "value": "Lift"}, {"label": "24/7 Security & CCTV", "value": "Security"}, {"label": "Power Backup", "value": "Power Backup"}, {"label": "Clubhouse & Gym", "value": "Gym"}, {"label": "Swimming Pool", "value": "Pool"}, {"label": "Children Play Area", "value": "Play Area"}, {"label": "Piped Gas (Adani/Gujarat Gas)", "value": "Gas"}, {"label": "Landscape Garden", "value": "Garden"}, {"label": "Intercom Facility", "value": "Intercom"}]'::jsonb);

        -- Insert Section 5 Fields (Media: Photos & Videos)
        INSERT INTO form_fields (version_id, section_id, field_key, label, field_type, placeholder, help_text, is_required, is_active, display_order, validation_rules, options)
        VALUES
        (v_version_id, v_sec_media, 'property_photos', 'Property Photos (Up to 50)', 'photos', 'Click or drag photos here', 'Upload clear photos of living room, bedrooms, kitchen, bathrooms, and exterior. Maximum 50 photos.', true, true, 1, 
         '{"max_files": 50, "allowed_types": ["image/jpeg", "image/png", "image/webp", "image/heic"], "max_file_size_mb": 25}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_media, 'property_videos', 'Property Videos / Walkthroughs (Up to 30)', 'videos', 'Click or drag video files here', 'Upload video walkthroughs of the property. Maximum 30 videos.', false, true, 2, 
         '{"max_files": 30, "allowed_types": ["video/mp4", "video/webm", "video/quicktime"], "max_file_size_mb": 50}'::jsonb, '[]'::jsonb);

        -- Insert Section 6 Fields (Remarks & Consent)
        INSERT INTO form_fields (version_id, section_id, field_key, label, field_type, placeholder, help_text, is_required, is_active, display_order, validation_rules, options)
        VALUES
        (v_version_id, v_sec_consent, 'remarks', 'Additional Remarks / Highlights', 'textarea', 'e.g. Corner unit, renovated modular kitchen, Italian marble flooring...', 'Any special features or notes for the telecaller and buyer', false, true, 1, '{"max_length": 1000}'::jsonb, '[]'::jsonb),

        (v_version_id, v_sec_consent, 'terms_consent', 'Declaration & Owner Consent', 'consent', '', 'I confirm that I am the owner or authorized representative of this property, and the details provided above are authentic and accurate. I authorize PropKart to contact me and market this listing.', true, true, 2, '{"required_checked": true}'::jsonb, '[]'::jsonb);

        RAISE NOTICE 'Default Property Registration Form v1 seeded successfully with form_id % and version_id %', v_form_id, v_version_id;
    ELSE
        RAISE NOTICE 'Form property-registration already exists with id %', v_form_id;
    END IF;
END $$;

COMMIT;
