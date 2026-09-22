import fs from "fs";
import path from "path";
import { ZipArchive } from "archiver";
import supabase from "../../config/supabase.js";
import { encryptString, decryptString, encryptJson, decryptJson } from "../../security/encryption.js";

/**
 * Decrypts a submission record transparently for authorized consumption
 */
export function decryptSubmission(sub) {
    if (!sub) return sub;
    const decryptedRaw = decryptJson(sub.raw_data) || {};

    // Auto-resolve listing_type and property_type from dynamic form fields if not directly indexed
    let listingType = sub.listing_type;
    if (!listingType && decryptedRaw) {
        listingType = decryptedRaw.property_for_rent_or_sale ||
            decryptedRaw.listing_type ||
            decryptedRaw.rent_or_sale ||
            decryptedRaw.purpose ||
            null;
    }

    let propertyType = sub.property_type;
    if (!propertyType && decryptedRaw) {
        propertyType = decryptedRaw.property_type ||
            decryptedRaw.property_type_select ||
            null;
    }

    let locationUrl = decryptString(sub.location_url);
    if (!locationUrl || locationUrl === "N/A" || locationUrl === "null") {
        const rawMaps = decryptedRaw.google_maps_location || decryptedRaw.google_location || decryptedRaw.location_url;
        if (rawMaps) {
            locationUrl = typeof rawMaps === "object" ? (rawMaps.url || rawMaps.location_url) : String(rawMaps);
        }
    }

    let directionUrl = decryptString(sub.direction_url);
    if (!directionUrl || directionUrl === "N/A" || directionUrl === "null") {
        directionUrl = decryptedRaw.direction___landmarks || decryptedRaw.direction || decryptedRaw.direction_landmarks || null;
    }

    let area = sub.area && sub.area !== "null" ? sub.area : null;
    if (!area && decryptedRaw) {
        area = decryptedRaw.area || decryptedRaw.areas || decryptedRaw.locality || decryptedRaw.locality_area || null;
    }

    let city = sub.city && sub.city !== "null" ? sub.city : null;
    if (!city && decryptedRaw) {
        city = decryptedRaw.city || null;
        const addr = String(decryptedRaw.property_address || decryptedRaw.address || "").toLowerCase();
        if (!city && addr.includes("ahmedabad")) city = "Ahmedabad";
        else if (!city && addr.includes("surat")) city = "Surat";
        else if (!city && (addr.includes("vadodara") || addr.includes("baroda"))) city = "Vadodara";
        else if (!city && addr.includes("rajkot")) city = "Rajkot";
        else if (!city && addr.includes("gandhinagar")) city = "Gandhinagar";
        if (!city && (area === "Gota" || area === "Ramdev nagar" || addr.includes("gujarat"))) city = "Ahmedabad";
    }

    return {
        ...sub,
        owner_name: decryptString(sub.owner_name),
        owner_phone: decryptString(sub.owner_phone),
        owner_email: decryptString(sub.owner_email),
        address: decryptString(sub.address) || decryptedRaw.property_address || null,
        city: city,
        area: area,
        location_url: locationUrl,
        direction_url: directionUrl,
        listing_type: listingType,
        property_type: propertyType,
        raw_data: decryptedRaw,
    };
}

/**
 * Locates uploaded media file on local disk across possible upload paths
 */
export function findMediaDiskPath(m) {
    if (!m) return null;
    const filename = path.basename(m.storage_path || m.public_url || "");
    if (!filename) return null;
    const rawPath = (m.storage_path || "").replace(/\\/g, "/");

    const candidatePaths = [
        path.join(process.cwd(), "public", "uploads", "submissions", filename),
        path.join(process.cwd(), "public", "uploads", "submissions", "photos", filename),
        path.join(process.cwd(), "public", "uploads", "submissions", "videos", filename),
        path.join(process.cwd(), "public", "uploads", filename),
        path.join(process.cwd(), "public", "uploads", rawPath.replace(/^\/?uploads\//, "")),
        path.join(process.cwd(), "public", rawPath),
        path.join(process.cwd(), "public", "uploads", rawPath),
    ];

    for (const p of candidatePaths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

/**
 * Fetch the currently published active form schema by slug
 */
export async function getActiveFormBySlug(slug = "property-registration") {
    // 1. Get form and its active published version
    const { data: form, error: formErr } = await supabase
        .from("forms")
        .select(`
            id, slug, title, description, is_active, current_version_id, assistance_phone,
            form_versions!fk_forms_current_version (
                id, version_number, status, published_at
            )
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (formErr || !form || !form.form_versions) {
        throw new Error(formErr?.message || "Active published form not found.");
    }

    const versionId = form.form_versions.id;

    // 2. Fetch sections for this version
    const { data: sections, error: secErr } = await supabase
        .from("form_sections")
        .select("id, title, description, display_order")
        .eq("version_id", versionId)
        .order("display_order", { ascending: true });

    if (secErr) throw secErr;

    // 3. Fetch active fields for this version
    const { data: fields, error: fieldErr } = await supabase
        .from("form_fields")
        .select("id, section_id, field_key, label, field_type, placeholder, help_text, description, is_required, display_order, validation_rules, options, conditional_visibility")
        .eq("version_id", versionId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

    if (fieldErr) throw fieldErr;

    // Group fields into their respective sections
    const fieldsBySection = {};
    for (const f of fields || []) {
        if (!fieldsBySection[f.section_id]) {
            fieldsBySection[f.section_id] = [];
        }
        fieldsBySection[f.section_id].push(f);
    }

    const structuredSections = (sections || []).map((sec) => ({
        ...sec,
        fields: fieldsBySection[sec.id] || [],
    }));

    return {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description,
        assistance_phone: form.assistance_phone || "+91 98980 12345",
        version: {
            id: form.form_versions.id,
            version_number: form.form_versions.version_number,
            published_at: form.form_versions.published_at,
        },
        sections: structuredSections,
    };
}

/**
 * Fetch full schema for a specific version (used in Form Builder & Admin)
 */
export async function getFormVersionSchema(versionId) {
    const { data: version, error: verErr } = await supabase
        .from("form_versions")
        .select("id, form_id, version_number, status, changelog, published_at, created_at")
        .eq("id", versionId)
        .single();

    if (verErr || !version) throw new Error("Version not found.");

    const { data: form } = await supabase
        .from("forms")
        .select("id, slug, title, description, is_active, current_version_id")
        .eq("id", version.form_id)
        .single();

    version.forms = form || null;

    const { data: sections, error: secErr } = await supabase
        .from("form_sections")
        .select("id, title, description, display_order")
        .eq("version_id", versionId)
        .order("display_order", { ascending: true });

    if (secErr) throw secErr;

    const { data: fields, error: fieldErr } = await supabase
        .from("form_fields")
        .select("*")
        .eq("version_id", versionId)
        .order("display_order", { ascending: true });

    if (fieldErr) throw fieldErr;

    const fieldsBySection = {};
    for (const f of fields || []) {
        if (!fieldsBySection[f.section_id]) {
            fieldsBySection[f.section_id] = [];
        }
        fieldsBySection[f.section_id].push(f);
    }

    return {
        version,
        sections: (sections || []).map((sec) => ({
            ...sec,
            fields: fieldsBySection[sec.id] || [],
        })),
    };
}

/**
 * Generate a unique registration code like PK-REG-2026-84912
 */
function generateRegistrationCode() {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    return `PK-REG-${year}-${randomSuffix}`;
}

/**
 * Create a new submission record with media and audit log
 */
export async function createSubmissionRecord({
    versionId,
    formId,
    fields,
    media = [],
    ipAddress = "",
    userAgent = "",
}) {
    let registrationCode = generateRegistrationCode();

    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
        const { data: existing } = await supabase
            .from("form_submissions")
            .select("id")
            .eq("registration_code", registrationCode)
            .maybeSingle();
        if (!existing) break;
        registrationCode = generateRegistrationCode();
        attempts++;
    }

    // Extract standard indexed fields if present in fields payload
    let ownerName = fields.owner_name || fields.owner_full_name || fields.full_name || fields.name || null;
    let ownerPhone = fields.owner_phone || fields.mobile_number || fields.mobile || fields.phone || fields.contact || null;
    let ownerEmail = fields.owner_email || fields.email || null;
    let propertyType = fields.property_type || fields.property_type_select || null;
    let listingType = fields.listing_type || fields.property_for_rent_or_sale || fields.rent_or_sale || fields.purpose || null;
    let city = fields.city || null;
    let area = fields.area || fields.areas || fields.locality || fields.locality_area || null;
    let address = fields.address || fields.property_address || fields.society_name || null;
    let directionUrl = fields.direction || fields.direction_landmarks || fields.direction_url || null;

    // Intelligent fallback by scanning keys
    for (const [k, v] of Object.entries(fields)) {
        if (!v || typeof v === "object") continue;
        const lk = k.toLowerCase();
        if (!ownerName && (lk.includes("name") || lk.includes("owner"))) ownerName = String(v);
        if (!ownerPhone && (lk.includes("phone") || lk.includes("mobile") || lk.includes("contact"))) ownerPhone = String(v);
        if (!ownerEmail && lk.includes("email")) ownerEmail = String(v);
        if (!propertyType && (lk.includes("property_type") || lk.includes("propertytype"))) propertyType = String(v);
        if (!listingType && (lk.includes("listing") || lk.includes("rent") || lk.includes("sale") || lk.includes("resale"))) listingType = String(v);
        if (!city && lk.includes("city")) city = String(v);
        if (!area && (lk.includes("area") || lk.includes("locality"))) area = String(v);
        if (!address && (lk.includes("address") || lk.includes("society"))) address = String(v);
        if (!directionUrl && (lk.includes("direction") || lk.includes("landmark"))) directionUrl = String(v);
    }

    if (!city && address) {
        const addrLower = String(address).toLowerCase();
        if (addrLower.includes("ahmedabad")) city = "Ahmedabad";
        else if (addrLower.includes("surat")) city = "Surat";
        else if (addrLower.includes("vadodara") || addrLower.includes("baroda")) city = "Vadodara";
        else if (addrLower.includes("rajkot")) city = "Rajkot";
        else if (addrLower.includes("gandhinagar")) city = "Gandhinagar";
    }
    if (!city && area) city = "Ahmedabad";

    let locationUrl = null;
    let latitude = null;
    let longitude = null;

    const mapsField = fields.google_maps_location || fields.google_location || fields.location_url || fields.maps_link;
    if (mapsField) {
        if (typeof mapsField === "object") {
            locationUrl = mapsField.url || mapsField.location_url || null;
            latitude = mapsField.lat || mapsField.latitude || null;
            longitude = mapsField.lng || mapsField.longitude || null;
        } else if (typeof mapsField === "string") {
            locationUrl = mapsField;
        }
    }

    const insertPayload = {
        registration_code: registrationCode,
        form_id: formId,
        version_id: versionId,
        status: "New",
        owner_name: encryptString(ownerName),
        owner_phone: encryptString(ownerPhone),
        owner_email: encryptString(ownerEmail),
        property_type: propertyType,
        listing_type: listingType,
        city: city,
        area: area,
        address: encryptString(address),
        location_url: encryptString(locationUrl),
        direction_url: encryptString(directionUrl),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        raw_data: encryptJson(fields),
        ip_address: ipAddress,
        user_agent: userAgent,
    };

    const { data: submission, error: subErr } = await supabase
        .from("form_submissions")
        .insert(insertPayload)
        .select()
        .single();

    if (subErr || !submission) {
        throw new Error(`Failed to create submission: ${subErr?.message}`);
    }

    // Insert media records if provided
    if (media && media.length > 0) {
        const mediaInserts = media.map((m, idx) => ({
            submission_id: submission.id,
            field_key: m.field_key || "property_photos",
            media_type: m.media_type || "photo",
            storage_path: m.storage_path,
            public_url: m.public_url,
            original_name: m.original_name || null,
            file_size: m.file_size || null,
            mime_type: m.mime_type || null,
            display_order: m.display_order ?? idx,
        }));

        const { error: mediaErr } = await supabase
            .from("submission_media")
            .insert(mediaInserts);

        if (mediaErr) {
            console.error("Failed to insert submission media:", mediaErr);
        }
    }

    // Insert audit log
    await supabase.from("submission_audit_logs").insert({
        submission_id: submission.id,
        form_id: formId,
        action: "submission_created",
        changes: {
            registration_code: registrationCode,
            owner_phone: ownerPhone,
            media_count: media.length,
        },
    });

    return submission;
}

/**
 * Get paginated list of submissions with flexible filters & search
 */
export async function getSubmissions({
    page = 1,
    limit = 20,
    search = "",
    status = "",
    property_type = "",
    listing_type = "",
    city = "",
    assigned_to = "",
    date_from = "",
    date_to = "",
    ids = "",
    sort_by = "created_at",
    sort_dir = "desc",
}) {
    const offset = (page - 1) * limit;

    let query = supabase
        .from("form_submissions")
        .select(`
            id, registration_code, form_id, version_id, status, assigned_to,
            owner_name, owner_phone, owner_email, property_type, listing_type,
            city, area, address, location_url, direction_url, raw_data,
            created_at, updated_at,
            assigned_user:users!form_submissions_assigned_to_fkey(id, full_name, email),
            media:submission_media(id, media_type, public_url, original_name, storage_path)
        `, { count: "exact" });

    if (ids) {
        const idArr = Array.isArray(ids)
            ? ids.map((x) => String(x).trim()).filter(Boolean)
            : decodeURIComponent(String(ids)).split(",").map((x) => x.trim()).filter(Boolean);
        if (idArr.length > 0) {
            query = query.in("id", idArr);
        }
    }

    if (search) {
        query = query.or(`registration_code.ilike.%${search}%,city.ilike.%${search}%,area.ilike.%${search}%,property_type.ilike.%${search}%,owner_name.ilike.%${search}%`);
    }

    if (status) {
        query = query.eq("status", status);
    }
    if (property_type) {
        query = query.eq("property_type", property_type);
    }
    if (listing_type && listing_type !== "All") {
        const cleanLt = listing_type.trim();
        const altLt = cleanLt.toLowerCase().includes("sale") ? "sale" : cleanLt;
        query = query.or(`listing_type.ilike.%${cleanLt}%,listing_type.ilike.%${altLt}%,raw_data->>property_for_rent_or_sale.ilike.%${cleanLt}%,raw_data->>listing_type.ilike.%${cleanLt}%`);
    }
    if (city) {
        query = query.eq("city", city);
    }
    if (assigned_to) {
        if (assigned_to === "unassigned") {
            query = query.is("assigned_to", null);
        } else {
            query = query.eq("assigned_to", assigned_to);
        }
    }
    if (date_from) {
        query = query.gte("created_at", date_from);
    }
    if (date_to) {
        query = query.lte("created_at", date_to);
    }

    query = query
        .order(sort_by, { ascending: sort_dir === "asc" })
        .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    let decryptedList = (data || []).map(decryptSubmission);

    // Filter by listing_type in decrypted rows (supports "Rent", "Re-sale", "Resale", etc.)
    if (listing_type && listing_type !== "All") {
        const target = listing_type.toLowerCase().replace(/[^a-z0-9]/g, "");
        decryptedList = decryptedList.filter((item) => {
            const itemLt = (item.listing_type || item.raw_data?.property_for_rent_or_sale || item.raw_data?.listing_type || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            return itemLt.includes(target) || target.includes(itemLt);
        });
    }

    // If search term was provided, also ensure decrypted fields match
    if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        decryptedList = decryptedList.filter((item) =>
            (item.registration_code && item.registration_code.toLowerCase().includes(s)) ||
            (item.owner_name && item.owner_name.toLowerCase().includes(s)) ||
            (item.owner_phone && item.owner_phone.includes(s)) ||
            (item.city && item.city.toLowerCase().includes(s)) ||
            (item.area && item.area.toLowerCase().includes(s)) ||
            (item.address && item.address.toLowerCase().includes(s)) ||
            (item.property_type && item.property_type.toLowerCase().includes(s)) ||
            (item.listing_type && item.listing_type.toLowerCase().includes(s))
        );
    }

    return {
        submissions: decryptedList,
        pagination: {
            total: count || 0,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil((count || 0) / limit),
        },
    };
}

/**
 * Get comprehensive submission detail with dynamic schema, media, notes, and audit logs
 */
export async function getSubmissionDetailById(id) {
    // 1. Fetch submission
    const { data: submission, error: subErr } = await supabase
        .from("form_submissions")
        .select(`
            *,
            assigned_user:users!form_submissions_assigned_to_fkey(id, full_name, email, mobile)
        `)
        .eq("id", id)
        .single();

    if (subErr || !submission) throw new Error("Submission not found.");

    // 2. Fetch version schema so Panel can dynamically render every field accurately
    const schema = await getFormVersionSchema(submission.version_id);

    // 3. Fetch media
    const { data: media, error: mediaErr } = await supabase
        .from("submission_media")
        .select("*")
        .eq("submission_id", id)
        .order("display_order", { ascending: true });

    // 4. Fetch telecaller notes
    const { data: notes, error: notesErr } = await supabase
        .from("submission_telecaller_notes")
        .select(`
            id, note, call_status, created_at,
            user:users!submission_telecaller_notes_user_id_fkey(id, full_name, email)
        `)
        .eq("submission_id", id)
        .order("created_at", { ascending: false });

    // 5. Fetch audit logs
    const { data: auditLogs } = await supabase
        .from("submission_audit_logs")
        .select(`
            id, action, changes, created_at,
            user:users!submission_audit_logs_user_id_fkey(id, full_name, email)
        `)
        .eq("submission_id", id)
        .order("created_at", { ascending: false });

    return {
        submission: decryptSubmission(submission),
        schema,
        media: media || [],
        notes: notes || [],
        audit_logs: auditLogs || [],
    };
}
/**
 * Get single submission by public registration code (for instant verification)
 */
export async function getSubmissionByRegistrationCode(code) {
    if (!code) return null;
    const { data, error } = await supabase
        .from("form_submissions")
        .select(`
            id, registration_code, form_id, version_id, status,
            owner_name, owner_phone, owner_email, property_type, listing_type,
            city, area, address, location_url, direction_url, raw_data,
            created_at
        `)
        .eq("registration_code", code.trim())
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return decryptSubmission(data);
}

/**
 * Check if a mobile number is already registered in our database
 */
export async function isPhoneAlreadyRegistered(phone) {
    if (!phone) return false;
    const cleanDigits = String(phone).replace(/\D/g, "").slice(-10);
    if (cleanDigits.length < 10) return false;

    // Fetch submissions to inspect phone numbers
    const { data, error } = await supabase
        .from("form_submissions")
        .select("id, owner_phone, raw_data");

    if (error || !data) return false;

    for (const sub of data) {
        const decryptedPhone = decryptString(sub.owner_phone);
        if (decryptedPhone) {
            const digits = String(decryptedPhone).replace(/\D/g, "").slice(-10);
            if (digits === cleanDigits) return true;
        }

        const raw = decryptJson(sub.raw_data);
        if (raw) {
            const rawPhone = raw.mobile_number || raw.phone || raw.owner_phone || raw.mobile || raw.contact;
            if (rawPhone) {
                const digits = String(rawPhone).replace(/\D/g, "").slice(-10);
                if (digits === cleanDigits) return true;
            }
        }
    }

    return false;
}

/**
 * Public Property Showcase data for propconnect.nbpropertytech.com
 */
export async function getPublicPropertyShowcase(code) {
    if (!code) return null;
    const sub = await getSubmissionByRegistrationCode(code);
    if (!sub) return null;

    const decrypted = decryptSubmission(sub);
    const raw = decrypted.raw_data || {};

    // Fetch form version schema to accurately resolve active fields
    let schema = null;
    if (sub.version_id) {
        try {
            schema = await getFormVersionSchema(sub.version_id);
        } catch (_) {}
    }

    const activeFields = (schema?.sections || [])
        .flatMap((sec) => (sec.fields || []).map((f) => ({ ...f, section_title: sec.title })))
        .filter((f) => f.is_active !== false);

    const activeKeys = new Set(activeFields.map((f) => f.field_key));

    // Dynamic fields to return: only active fields with present, non-empty values
    const dynamicFields = [];
    const internalKeys = new Set([
        "photos", "videos", "consent", "declaration", "terms", "owner_declaration",
        "owner_phone", "mobile_number", "phone", "owner_email", "email",
        "expected_price", "property_address", "address",
    ]);

    if (activeFields.length > 0) {
        for (const f of activeFields) {
            if (internalKeys.has(f.field_key)) continue;
            const val = raw[f.field_key];
            if (val !== undefined && val !== null && val !== "" && val !== "null" && val !== "N/A") {
                let cleanVal = val;
                if (f.field_type === "google_location" && typeof val === "object") {
                    cleanVal = val.url || val.location_url || val.address || "";
                }
                dynamicFields.push({
                    key: f.field_key,
                    label: f.label,
                    value: cleanVal,
                    type: f.field_type,
                    section: f.section_title,
                });
            }
        }
    } else {
        for (const [k, v] of Object.entries(raw)) {
            if (internalKeys.has(k) || !v || v === "null" || v === "N/A") continue;
            dynamicFields.push({
                key: k,
                label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                value: v,
                type: "text",
            });
        }
    }

    // Direction/Landmark: ONLY if field is active in schema and has non-empty value
    const hasDirectionField = activeKeys.size === 0 ||
        activeKeys.has("direction___landmarks") ||
        activeKeys.has("direction") ||
        activeKeys.has("direction_landmarks") ||
        activeKeys.has("landmark");

    let directionVal = null;
    if (hasDirectionField) {
        const rawDir = raw.direction___landmarks || raw.direction || raw.direction_landmarks || raw.landmark || decrypted.direction_url;
        if (rawDir && rawDir !== "null" && rawDir !== "N/A" && String(rawDir).trim().length > 0) {
            directionVal = String(rawDir).trim();
        }
    }

    const { data: media } = await supabase
        .from("submission_media")
        .select("id, media_type, storage_path, public_url, original_name, display_order")
        .eq("submission_id", sub.id)
        .order("display_order", { ascending: true });

    return {
        registration_code: sub.registration_code,
        created_at: sub.created_at,
        property_type: decrypted.property_type || "Residential",
        listing_type: decrypted.listing_type || "Sale",
        city: decrypted.city || "Ahmedabad",
        area: decrypted.area || "",
        address: decrypted.address || "",
        direction: directionVal,
        location_url: decrypted.location_url || (typeof raw.google_maps_location === "object" ? raw.google_maps_location.url : raw.google_maps_location) || "",
        expected_price: raw.expected_price ? Number(raw.expected_price) : null,
        dynamic_fields: dynamicFields,
        photos: (media || [])
            .filter((m) => m.media_type === "photo" || m.storage_path?.match(/\.(jpg|jpeg|png|webp|avif)$/i))
            .map((m) => ({
                id: m.id,
                url: m.public_url,
                storage_path: m.storage_path,
            })),
        status: sub.status,
    };
}

/**
 * Update submission status with telecaller audit trail
 */
export async function updateSubmissionStatus(id, newStatus, userId, note = "") {
    const { data: current, error: getErr } = await supabase
        .from("form_submissions")
        .select("status, form_id")
        .eq("id", id)
        .single();

    if (getErr || !current) throw new Error("Submission not found.");

    const oldStatus = current.status;

    const { data: updated, error: updateErr } = await supabase
        .from("form_submissions")
        .update({ status: newStatus })
        .eq("id", id)
        .select()
        .single();

    if (updateErr) throw updateErr;

    // Log audit
    await supabase.from("submission_audit_logs").insert({
        submission_id: id,
        form_id: current.form_id,
        user_id: userId,
        action: "status_changed",
        changes: { old_status: oldStatus, new_status: newStatus, note },
    });

    // If note provided, add to telecaller notes
    if (note && note.trim().length > 0) {
        await supabase.from("submission_telecaller_notes").insert({
            submission_id: id,
            user_id: userId,
            note: `Status changed to ${newStatus}: ${note}`,
            call_status: newStatus,
        });
    }

    return updated;
}

/**
 * Assign submission to a telecaller
 */
export async function assignSubmission(id, assignedToUserId, currentUserId) {
    const { data: current } = await supabase
        .from("form_submissions")
        .select("assigned_to, form_id")
        .eq("id", id)
        .single();

    const { data: updated, error } = await supabase
        .from("form_submissions")
        .update({ assigned_to: assignedToUserId })
        .eq("id", id)
        .select(`
            *,
            assigned_user:users!form_submissions_assigned_to_fkey(id, full_name, email)
        `)
        .single();

    if (error) throw error;

    await supabase.from("submission_audit_logs").insert({
        submission_id: id,
        form_id: current?.form_id,
        user_id: currentUserId,
        action: "assigned_telecaller",
        changes: { previous_assigned_to: current?.assigned_to, new_assigned_to: assignedToUserId },
    });

    return updated;
}

/**
 * Update dynamic submission values (Telecaller data enrichment)
 */
export async function updateSubmissionData(id, newFields, currentUserId) {
    const { data: current } = await supabase
        .from("form_submissions")
        .select("raw_data, form_id")
        .eq("id", id)
        .single();

    const currentDecrypted = decryptJson(current?.raw_data || {});
    const mergedData = { ...currentDecrypted, ...newFields };

    // Update indexed columns if touched
    const updates = { raw_data: encryptJson(mergedData) };
    if (newFields.owner_name) updates.owner_name = encryptString(newFields.owner_name);
    if (newFields.owner_phone) updates.owner_phone = encryptString(newFields.owner_phone);
    if (newFields.owner_email) updates.owner_email = encryptString(newFields.owner_email);
    if (newFields.property_type) updates.property_type = newFields.property_type;
    if (newFields.listing_type) updates.listing_type = newFields.listing_type;
    if (newFields.city) updates.city = newFields.city;
    if (newFields.area) updates.area = newFields.area;
    if (newFields.address) updates.address = encryptString(newFields.address);
    if (newFields.direction) updates.direction_url = encryptString(newFields.direction);

    const { data: updated, error } = await supabase
        .from("form_submissions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;

    await supabase.from("submission_audit_logs").insert({
        submission_id: id,
        form_id: current?.form_id,
        user_id: currentUserId,
        action: "submission_data_updated",
        changes: { updated_fields: Object.keys(newFields) },
    });

    return decryptSubmission(updated);
}

/**
 * Add a telecaller call log note
 */
export async function addTelecallerNote(submissionId, userId, note, callStatus = null) {
    const { data, error } = await supabase
        .from("submission_telecaller_notes")
        .insert({
            submission_id: submissionId,
            user_id: userId,
            note: note,
            call_status: callStatus,
        })
        .select(`
            id, note, call_status, created_at,
            user:users!submission_telecaller_notes_user_id_fkey(id, full_name, email)
        `)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Telecaller converts verified submission into main properties table
 */
export async function convertSubmissionToProperty(submissionId, currentUserId) {
    const { data: sub, error: subErr } = await supabase
        .from("form_submissions")
        .select("*, media:submission_media(*)")
        .eq("id", submissionId)
        .single();

    if (subErr || !sub) throw new Error("Submission not found.");

    const raw = sub.raw_data || {};

    // Map submission to properties table schema
    const propertyPayload = {
        title: `${raw.bhk || sub.property_type || 'Property'} in ${sub.area || sub.city || 'Gujarat'}`,
        description: raw.address || sub.address || raw.remarks || "",
        property_type: sub.property_type || "Apartment",
        listing_type: sub.listing_type || "Sell",
        price: raw.expected_price ? Number(raw.expected_price) : 0,
        area: raw.built_up_area ? Number(raw.built_up_area) : 0,
        bhk: raw.bhk || null,
        floor_number: raw.floor_number ? Number(raw.floor_number) : null,
        total_floors: raw.total_floors ? Number(raw.total_floors) : null,
        address: sub.address || raw.address,
        city: sub.city || "Ahmedabad",
        location_url: sub.location_url,
        status: "Available",
        created_by: currentUserId,
    };

    // Insert into properties
    const { data: newProp, error: propErr } = await supabase
        .from("properties")
        .insert(propertyPayload)
        .select()
        .single();

    if (propErr) throw propErr;

    // Attach images to property_images if any
    if (sub.media && sub.media.length > 0) {
        const photoInserts = sub.media
            .filter((m) => m.media_type === "photo")
            .map((m, idx) => ({
                property_id: newProp.id,
                image_url: m.public_url,
                is_primary: idx === 0,
            }));

        if (photoInserts.length > 0) {
            await supabase.from("property_images").insert(photoInserts);
        }
    }

    // Update submission status to 'Converted'
    await updateSubmissionStatus(submissionId, "Converted", currentUserId, `Converted to Property Inventory ID: ${newProp.id}`);

    return { property: newProp, submission_id: submissionId };
}

/**
 * Get dashboard KPI stats for Submissions
 */
export async function getSubmissionKPIStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [
        { count: totalCount },
        { count: newTodayCount },
        { count: pendingContactCount },
        { count: contactedCount },
        { count: convertedCount },
        { count: totalPhotos },
        { count: totalVideos },
    ] = await Promise.all([
        supabase.from("form_submissions").select("*", { count: "exact", head: true }),
        supabase.from("form_submissions").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
        supabase.from("form_submissions").select("*", { count: "exact", head: true }).eq("status", "Contact Pending"),
        supabase.from("form_submissions").select("*", { count: "exact", head: true }).eq("status", "Contacted"),
        supabase.from("form_submissions").select("*", { count: "exact", head: true }).eq("status", "Converted"),
        supabase.from("submission_media").select("*", { count: "exact", head: true }).eq("media_type", "photo"),
        supabase.from("submission_media").select("*", { count: "exact", head: true }).eq("media_type", "video"),
    ]);

    return {
        total: totalCount || 0,
        today: newTodayCount || 0,
        pending_contact: pendingContactCount || 0,
        contacted: contactedCount || 0,
        converted: convertedCount || 0,
        photos: totalPhotos || 0,
        videos: totalVideos || 0,
    };
}

/**
 * Save draft schema (Form Builder bulk update)
 */
export async function saveDraftVersionSchema(versionId, sectionsWithFields, userId) {
    const { data: version, error: verErr } = await supabase
        .from("form_versions")
        .select("id, form_id, status")
        .eq("id", versionId)
        .single();

    if (verErr || !version) throw new Error("Version not found.");
    if (version.status !== "draft") {
        throw new Error("Cannot modify a published or archived form version. Create a new draft version first.");
    }

    // 1. Remove existing sections and fields for this draft version
    await supabase.from("form_fields").delete().eq("version_id", versionId);
    await supabase.from("form_sections").delete().eq("version_id", versionId);

    // 2. Insert new sections and fields
    for (let sIdx = 0; sIdx < sectionsWithFields.length; sIdx++) {
        const sec = sectionsWithFields[sIdx];
        const { data: newSec, error: secErr } = await supabase
            .from("form_sections")
            .insert({
                version_id: versionId,
                title: sec.title,
                description: sec.description || null,
                display_order: sIdx + 1,
            })
            .select()
            .single();

        if (secErr) throw secErr;

        if (sec.fields && sec.fields.length > 0) {
            const fieldInserts = sec.fields.map((f, fIdx) => ({
                version_id: versionId,
                section_id: newSec.id,
                field_key: f.field_key,
                label: f.label,
                field_type: f.field_type,
                placeholder: f.placeholder || null,
                help_text: f.help_text || null,
                description: f.description || null,
                is_required: !!f.is_required,
                is_active: f.is_active !== false,
                display_order: fIdx + 1,
                validation_rules: f.validation_rules || {},
                options: f.options || [],
                conditional_visibility: f.conditional_visibility || null,
            }));

            const { error: fieldErr } = await supabase
                .from("form_fields")
                .insert(fieldInserts);

            if (fieldErr) throw fieldErr;
        }
    }

    await supabase.from("submission_audit_logs").insert({
        form_id: version.form_id,
        user_id: userId,
        action: "draft_schema_saved",
        changes: { version_id: versionId, sections_count: sectionsWithFields.length },
    });

    return getFormVersionSchema(versionId);
}

/**
 * Direct Simple Form Fields Update (No complex versioning/software bloat)
 */
export async function saveActiveFormFields(fields = [], userId) {
    const { data: form, error: formErr } = await supabase
        .from("forms")
        .select("id, slug, current_version_id")
        .eq("slug", "property-registration")
        .single();

    if (formErr || !form) throw new Error("Active form not found.");

    const versionId = form.current_version_id;

    // Ensure at least one section exists
    let { data: section } = await supabase
        .from("form_sections")
        .select("id")
        .eq("version_id", versionId)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (!section) {
        const { data: newSec, error: secErr } = await supabase
            .from("form_sections")
            .insert({
                version_id: versionId,
                title: "Property Registration",
                display_order: 1,
            })
            .select()
            .single();
        if (secErr) throw secErr;
        section = newSec;
    }

    // Delete existing fields for this version
    await supabase.from("form_fields").delete().eq("version_id", versionId);

    // Clean up any other empty sections for this version so schema is clean
    await supabase.from("form_sections").delete().eq("version_id", versionId).neq("id", section.id);

    // Insert updated fields
    if (fields.length > 0) {
        const usedKeys = new Set();
        const fieldInserts = fields.map((f, idx) => {
            let key = (f.field_key || f.label || `field_${idx + 1}`)
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, 50);
            if (!key) key = `field_${idx + 1}`;
            while (usedKeys.has(key)) {
                key = `${key}_${idx + 1}`;
            }
            usedKeys.add(key);

            return {
                version_id: versionId,
                section_id: section.id,
                field_key: key,
                label: f.label || `Field ${idx + 1}`,
                field_type: f.field_type || "text",
                placeholder: f.placeholder || null,
                help_text: f.help_text || null,
                is_required: !!f.is_required,
                is_active: f.is_active !== false,
                display_order: idx + 1,
                validation_rules: f.validation_rules || {},
                options: Array.isArray(f.options) ? f.options : [],
            };
        });

        const { error: insertErr } = await supabase
            .from("form_fields")
            .insert(fieldInserts);

        if (insertErr) throw insertErr;
    }

    return getActiveFormBySlug("property-registration");
}

/**
 * Publish a draft version
 */
export async function publishFormVersion(versionId, userId) {
    const { data: version, error: verErr } = await supabase
        .from("form_versions")
        .select("id, form_id, version_number, status")
        .eq("id", versionId)
        .single();

    if (verErr || !version) throw new Error("Version not found.");
    if (version.status === "published") return version;

    // 1. Archive previously published version
    await supabase
        .from("form_versions")
        .update({ status: "archived" })
        .eq("form_id", version.form_id)
        .eq("status", "published");

    // 2. Set this version to published
    const { data: publishedVer, error: pubErr } = await supabase
        .from("form_versions")
        .update({
            status: "published",
            published_at: new Date().toISOString(),
        })
        .eq("id", versionId)
        .select()
        .single();

    if (pubErr) throw pubErr;

    // 3. Point forms.current_version_id to this version
    await supabase
        .from("forms")
        .update({ current_version_id: versionId })
        .eq("id", version.form_id);

    // 4. Log audit
    await supabase.from("submission_audit_logs").insert({
        form_id: version.form_id,
        user_id: userId,
        action: "form_version_published",
        changes: { version_number: version.version_number, version_id: versionId },
    });

    return publishedVer;
}

/**
 * Create a new draft version from an existing version
 */
export async function createDraftVersion(formId, userId, changelog = "New draft version") {
    // 1. Find latest version number
    const { data: versions } = await supabase
        .from("form_versions")
        .select("id, version_number, status")
        .eq("form_id", formId)
        .order("version_number", { ascending: false })
        .limit(1);

    const latest = versions && versions[0];
    const newVersionNumber = latest ? latest.version_number + 1 : 1;

    // Check if there is already a draft
    const { data: existingDraft } = await supabase
        .from("form_versions")
        .select("id")
        .eq("form_id", formId)
        .eq("status", "draft")
        .maybeSingle();

    if (existingDraft) {
        throw new Error("A draft version already exists. Please edit or publish the existing draft before creating a new one.");
    }

    // Insert new draft version
    const { data: newVersion, error: insErr } = await supabase
        .from("form_versions")
        .insert({
            form_id: formId,
            version_number: newVersionNumber,
            status: "draft",
            changelog: changelog,
            created_by: userId,
        })
        .select()
        .single();

    if (insErr) throw insErr;

    // If there was a previous version, clone its sections and fields into the new draft!
    if (latest) {
        const { sections } = await getFormVersionSchema(latest.id);
        await saveDraftVersionSchema(newVersion.id, sections, userId);
    }

    return newVersion;
}

/**
 * Permanently delete a submission record and its physical media files
 */
export async function deleteSubmissionRecord(id, userId) {
    // 1. Fetch media to clean up disk storage
    const { data: mediaItems } = await supabase
        .from("submission_media")
        .select("*")
        .eq("submission_id", id);

    if (mediaItems && mediaItems.length > 0) {
        for (const m of mediaItems) {
            const diskPath = findMediaDiskPath(m);
            if (diskPath && fs.existsSync(diskPath)) {
                try {
                    fs.unlinkSync(diskPath);
                } catch (e) {
                    console.warn(`Could not remove file ${diskPath}:`, e.message);
                }
            }
        }
    }

    // 2. Delete submission from PostgreSQL (cascades to media, notes, and audit logs)
    const { data: deleted, error } = await supabase
        .from("form_submissions")
        .delete()
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return deleted;
}

/**
 * Permanently delete multiple property submissions and cascade physical media
 */
export async function bulkDeleteSubmissions(ids, userId) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return { count: 0 };

    // 1. Fetch physical media to clean from local uploads disk
    const { data: mediaItems } = await supabase
        .from("submission_media")
        .select("*")
        .in("submission_id", ids);

    for (const m of mediaItems || []) {
        const diskPath = findMediaDiskPath(m);
        if (diskPath && fs.existsSync(diskPath)) {
            try {
                fs.unlinkSync(diskPath);
            } catch (e) {
                console.warn(`Could not remove file ${diskPath}:`, e.message);
            }
        }
    }

    // 2. Cascade delete from PostgreSQL
    const { data: deleted, error } = await supabase
        .from("form_submissions")
        .delete()
        .in("id", ids)
        .select("id");

    if (error) throw error;
    return { count: deleted?.length || 0 };
}

/**
 * Bulk update lifecycle status for multiple submissions
 */
export async function bulkUpdateSubmissionStatus(ids, status, userId) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return { count: 0 };

    const { data: updated, error } = await supabase
        .from("form_submissions")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", ids)
        .select("id, status");

    if (error) throw error;
    return { count: updated?.length || 0 };
}

/**
 * Update the header assistance phone number in forms table
 */
export async function updateAssistancePhone(phone, slug = "property-registration") {
    const cleanPhone = String(phone).trim();
    const { data, error } = await supabase
        .from("forms")
        .update({ assistance_phone: cleanPhone })
        .eq("slug", slug)
        .select("id, slug, title, assistance_phone")
        .single();

    if (error) throw error;
    return data;
}

/**
 * Stream a complete ZIP archive containing the CSV spreadsheet report and all photos
 * Supports 3 scopes:
 * - Individual: Single property ZIP with property_<code_or_id>_report.csv and photos/
 * - Selected: Multiple selected properties ZIP with selected_properties_report.csv and <code>/photos/
 * - All Data: Full property pool ZIP with all_properties_report.csv and <code>/photos/
 */
export async function exportSubmissionsZipStream(res, query = {}) {
    // 1. Fetch matching submissions (supports single id, selected ids, or all)
    const { submissions } = await getSubmissions({ ...query, limit: 2000 });

    const archive = new ZipArchive({ zlib: { level: 9 } });

    if (!submissions || submissions.length === 0) {
        res.attachment("propkart_empty_export.zip");
        archive.pipe(res);
        archive.append("No matching submissions found for export.\r\n", { name: "empty.txt" });
        await archive.finalize();
        return;
    }

    // 2. Fetch all media for these submissions
    const subIds = submissions.map((s) => s.id);
    const mediaMap = {};
    if (subIds.length > 0) {
        const { data: allMedia } = await supabase
            .from("submission_media")
            .select("*")
            .in("submission_id", subIds);
        (allMedia || []).forEach((m) => {
            if (!mediaMap[m.submission_id]) mediaMap[m.submission_id] = [];
            mediaMap[m.submission_id].push(m);
        });
    }

    // 3. Build CSV spreadsheet
    const csvHeaders = [
        "Registration Code",
        "Inflow Date",
        "Owner Name",
        "Mobile Number",
        "Email Address",
        "Property Type",
        "Listing Type",
        "City",
        "Area",
        "Address",
        "Status",
        "Expected Price",
        "Built-up Area",
        "BHK",
        "Furnishing",
        "Google Location",
        "Remarks",
        "Photos Count",
        "Photos List",
    ];

    const csvRows = submissions.map((s) => {
        const raw = s.raw_data || {};
        const mediaList = mediaMap[s.id] || [];
        const photoNames = mediaList.map((m) => m.original_name || path.basename(m.storage_path || "")).join("; ");

        const row = [
            s.registration_code || "",
            s.created_at ? new Date(s.created_at).toLocaleString("en-IN") : "",
            s.owner_name || "",
            s.owner_phone || "",
            s.owner_email || "",
            s.property_type || "",
            s.listing_type || "",
            s.city || "",
            s.area || "",
            (s.address || "").replace(/\r?\n/g, " "),
            s.status || "",
            raw.expected_price || "",
            raw.built_up_area || "",
            raw.bhk || "",
            raw.furnishing || "",
            s.location_url || (typeof raw.google_location === "string" ? raw.google_location : raw.google_location?.url) || "",
            (raw.remarks || "").replace(/\r?\n/g, " "),
            mediaList.length,
            photoNames,
        ];

        return row.map((val) => `"${String(val || "").replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\r\n");

    // 4. Determine archive filename based on scope
    const isSingle = submissions.length === 1;
    const isSelected = Boolean(query.ids) && submissions.length > 1;
    let archiveFileName = "";
    let csvFileNameInside = "";

    if (isSingle) {
        const code = submissions[0].registration_code || "property";
        archiveFileName = `property_${code}_with_photos.zip`;
        csvFileNameInside = `property_${code}_report.csv`;
    } else if (isSelected) {
        archiveFileName = `propkart_selected_${submissions.length}_properties_with_photos.zip`;
        csvFileNameInside = `selected_properties_report.csv`;
    } else {
        archiveFileName = `propkart_all_properties_with_photos_${Date.now()}.zip`;
        csvFileNameInside = `all_properties_report.csv`;
    }

    res.attachment(archiveFileName);
    archive.pipe(res);

    // Append CSV report file
    archive.append(csvContent, { name: csvFileNameInside });

    // Append photo files from local disk
    for (const s of submissions) {
        const code = s.registration_code || s.id;
        const mediaList = mediaMap[s.id] || [];
        for (let idx = 0; idx < mediaList.length; idx++) {
            const m = mediaList[idx];
            const diskPath = findMediaDiskPath(m);
            if (diskPath && fs.existsSync(diskPath)) {
                const ext = path.extname(diskPath) || ".jpg";
                const base = path.basename(m.original_name || diskPath, ext).replace(/[^a-zA-Z0-9._-]/g, "_");
                const safeName = `${String(idx + 1).padStart(2, "0")}_${base}${ext}`;

                if (isSingle) {
                    // Single property: directly under photos/
                    archive.file(diskPath, { name: `photos/${safeName}` });
                } else {
                    // Multiple properties: under <registration_code>/photos/
                    archive.file(diskPath, { name: `${code}/photos/${safeName}` });
                }
            }
        }
    }

    await archive.finalize();
}

/**
 * Generate and send CSV data spreadsheet
 * Supports 3 scopes:
 * - Individual: Single property CSV named property_<code_or_id>.csv
 * - Selected: Multiple selected CSV named propkart_selected_<count>_properties.csv
 * - All Data: Full pool CSV named propkart_all_properties_<timestamp>.csv
 */
export async function exportSubmissionsCsv(res, query = {}) {
    const { submissions } = await getSubmissions({ ...query, limit: 2000 });

    if (!submissions || submissions.length === 0) {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.attachment("propkart_empty_report.csv");
        return res.send("Registration Code,Inflow Date,Owner Name,Status\r\n");
    }

    const isSingle = submissions.length === 1;
    const isSelected = Boolean(query.ids) && submissions.length > 1;
    let csvFileName = "";

    if (isSingle) {
        const code = submissions[0].registration_code || "property";
        csvFileName = `property_${code}.csv`;
    } else if (isSelected) {
        csvFileName = `propkart_selected_${submissions.length}_properties.csv`;
    } else {
        csvFileName = `propkart_all_properties_${Date.now()}.csv`;
    }

    const csvHeaders = [
        "Registration Code",
        "Inflow Date",
        "Owner Name",
        "Mobile Number",
        "Email Address",
        "Property Type",
        "Listing Type",
        "City",
        "Area",
        "Address",
        "Status",
        "Expected Price",
        "Built-up Area",
        "BHK",
        "Furnishing",
        "Google Location",
        "Remarks",
    ];

    const csvRows = submissions.map((s) => {
        const raw = s.raw_data || {};
        const row = [
            s.registration_code || "",
            s.created_at ? new Date(s.created_at).toLocaleString("en-IN") : "",
            s.owner_name || "",
            s.owner_phone || "",
            s.owner_email || "",
            s.property_type || "",
            s.listing_type || "",
            s.city || "",
            s.area || "",
            (s.address || "").replace(/\r?\n/g, " "),
            s.status || "",
            raw.expected_price || "",
            raw.built_up_area || "",
            raw.bhk || "",
            raw.furnishing || "",
            s.location_url || (typeof raw.google_location === "string" ? raw.google_location : raw.google_location?.url) || "",
            (raw.remarks || "").replace(/\r?\n/g, " "),
        ];

        return row.map((val) => `"${String(val || "").replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.attachment(csvFileName);
    return res.send(csvContent);
}

export async function getActiveUsers() {
    const { data: users, error } = await supabase
        .from("users")
        .select("id, email, full_name, mobile, roles(name)")
        .eq("is_active", true);

    if (error) throw error;

    return (users || []).map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        mobile: u.mobile,
        role: u.roles?.name || "Admin",
    }));
}

