import * as repo from "./dynamic_forms.repository.js";
import supabase from "../../config/supabase.js";

/**
 * Server-side Validation Engine
 * Validates submission fields payload against the actual active form version fields
 */
export async function validateSubmissionAgainstSchema(versionId, fields, media = []) {
    // 1. Fetch active fields for this version
    const { data: formFields, error } = await supabase
        .from("form_fields")
        .select("id, field_key, label, field_type, is_required, is_active, validation_rules, options")
        .eq("version_id", versionId)
        .eq("is_active", true);

    if (error || !formFields) {
        throw new Error("Unable to retrieve form fields for validation.");
    }

    const validationErrors = {};

    for (const field of formFields) {
        const val = fields[field.field_key];
        const rules = field.validation_rules || {};

        // 1. Required Check
        if (field.is_required) {
            if (field.field_type === "photos") {
                const photosCount = media.filter((m) => m.media_type === "photo" || m.field_key === field.field_key).length;
                if (photosCount === 0) {
                    validationErrors[field.field_key] = `${field.label} is required (at least 1 photo).`;
                }
            } else if (field.field_type === "consent") {
                if (val !== true && val !== "true" && val !== 1) {
                    validationErrors[field.field_key] = `You must agree to the ${field.label}.`;
                }
            } else if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
                validationErrors[field.field_key] = `${field.label} is required.`;
                continue;
            }
        }

        if (val === undefined || val === null || val === "") {
            continue; // Optional field empty, move on
        }

        // 2. Type-specific validations
        if (field.field_type === "phone") {
            const cleanPhone = String(val).replace(/\D/g, "");
            if (cleanPhone.length < 10) {
                validationErrors[field.field_key] = "Please enter a valid 10-digit mobile number.";
            }
        } else if (field.field_type === "email") {
            if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim())) {
                validationErrors[field.field_key] = "Please enter a valid email address.";
            }
        } else if (["number", "currency", "area"].includes(field.field_type)) {
            const num = Number(val);
            if (isNaN(num)) {
                validationErrors[field.field_key] = `${field.label} must be a valid number.`;
            } else {
                if (rules.min_value !== undefined && num < rules.min_value) {
                    validationErrors[field.field_key] = `${field.label} must be at least ${rules.min_value}.`;
                }
                if (rules.max_value !== undefined && num > rules.max_value) {
                    validationErrors[field.field_key] = `${field.label} cannot exceed ${rules.max_value}.`;
                }
            }
        } else if (["text", "textarea", "name", "direction"].includes(field.field_type)) {
            const strVal = String(val).trim();
            if (rules.min_length !== undefined && strVal.length < rules.min_length) {
                validationErrors[field.field_key] = `${field.label} must be at least ${rules.min_length} characters.`;
            }
            if (rules.max_length !== undefined && strVal.length > rules.max_length) {
                validationErrors[field.field_key] = `${field.label} cannot exceed ${rules.max_length} characters.`;
            }
        } else if (field.field_type === "google_location") {
            let locUrl = typeof val === "object" ? (val.url || val.location_url) : val;
            const hasCoords = typeof val === "object" && val.lat && val.lng;
            if (rules.url_required && !hasCoords && (!locUrl || !String(locUrl).startsWith("http"))) {
                validationErrors[field.field_key] = "Please provide a valid Google Maps link or pin your location.";
            }
        }
    }

    // 3. Media Limit Validations (Max 50 Photos, Max 30 Videos)
    const photos = media.filter((m) => m.media_type === "photo");
    const videos = media.filter((m) => m.media_type === "video");

    if (photos.length > 50) {
        validationErrors["property_photos"] = "Maximum allowed photos is 50.";
    }
    if (videos.length > 30) {
        validationErrors["property_videos"] = "Maximum allowed videos is 30.";
    }

    return {
        isValid: Object.keys(validationErrors).length === 0,
        errors: validationErrors,
    };
}

/**
 * Handle new public submission
 */
export async function submitRegistrationForm({ versionId, fields, media = [], ipAddress, userAgent }) {
    // 1. Fetch form version to ensure it is published (resolves by versionId or formId fallback)
    let version = null;
    const { data: versionById } = await supabase
        .from("form_versions")
        .select("id, form_id, status")
        .eq("id", versionId)
        .maybeSingle();

    if (versionById && versionById.status === "published") {
        version = versionById;
    } else {
        const { data: versionByForm } = await supabase
            .from("form_versions")
            .select("id, form_id, status")
            .eq("form_id", versionId)
            .eq("status", "published")
            .order("version_number", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (versionByForm) {
            version = versionByForm;
        }
    }

    if (!version || version.status !== "published") {
        throw new Error("This form version is not currently accepting submissions.");
    }

    const actualVersionId = version.id;

    // 2. Fetch parent form to ensure active
    const { data: form } = await supabase
        .from("forms")
        .select("is_active")
        .eq("id", version.form_id)
        .maybeSingle();

    if (!form || !form.is_active) {
        throw new Error("This form is currently inactive.");
    }

    // 3. Server-side validation
    const { isValid, errors } = await validateSubmissionAgainstSchema(actualVersionId, fields, media);
    if (!isValid) {
        const error = new Error("Validation failed for form submission.");
        error.name = "ValidationError";
        error.fields = errors;
        throw error;
    }

    // 4. Insert submission record
    const submission = await repo.createSubmissionRecord({
        versionId: actualVersionId,
        formId: version.form_id,
        fields,
        media,
        ipAddress,
        userAgent,
    });

    return submission;
}
