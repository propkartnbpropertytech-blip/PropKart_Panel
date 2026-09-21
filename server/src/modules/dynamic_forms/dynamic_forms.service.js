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

    // Fetch assistance phone to prevent collision
    let assistanceDigits = "9879458308";
    try {
        const { data: vData } = await supabase
            .from("form_versions")
            .select("form_id, forms:forms(assistance_phone)")
            .eq("id", versionId)
            .maybeSingle();
        if (vData?.forms?.assistance_phone) {
            assistanceDigits = String(vData.forms.assistance_phone).replace(/\D/g, "").slice(-10);
        }
    } catch (_) {}

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
            const cleanPhone = String(val).replace(/\D/g, "").slice(-10);
            if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
                validationErrors[field.field_key] = "Please enter a valid 10-digit mobile number.";
            } else if (cleanPhone === assistanceDigits) {
                validationErrors[field.field_key] = `Mobile number cannot be the same as the PropKart assistance number (${assistanceDigits}). Please enter your personal mobile number.`;
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
                // Rent Cap Validation: Cannot exceed 10 Lakhs (1,000,000)
                if (field.field_key === "expected_price" || field.field_key.includes("rent")) {
                    const purpose = String(fields.property_for_rent_or_sale || fields.listing_type || "").trim().toLowerCase();
                    if (purpose === "rent" || purpose.includes("rent")) {
                        if (num > 1000000) {
                            validationErrors[field.field_key] = "Expected rent cannot exceed ₹10,00,000 (10 Lakhs). Please enter a valid rent amount.";
                        }
                    }
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
            const locUrl = typeof val === "object" ? (val.url || val.location_url) : val;
            const hasCoords = typeof val === "object" && val.lat && val.lng;
            if (locUrl) {
                const isMaps = /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(locUrl).trim());
                if (!isMaps) {
                    validationErrors[field.field_key] = "Only official Google Maps links (e.g. https://maps.app.goo.gl/... or https://maps.google.com/...) are accepted.";
                }
            } else if (field.is_required && !hasCoords) {
                validationErrors[field.field_key] = "Please provide a valid Google Maps link or capture GPS coordinates.";
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

    // 4. Duplicate mobile check
    const phoneVal = fields.mobile_number || fields.owner_phone || fields.phone || fields.contact;
    if (phoneVal) {
        const isDuplicate = await repo.isPhoneAlreadyRegistered(phoneVal);
        if (isDuplicate) {
            const error = new Error("This mobile number is already registered in our system. Duplicate submissions are not allowed.");
            error.name = "ValidationError";
            error.fields = {
                mobile_number: "This mobile number is already registered in our system. Duplicate submissions are not allowed.",
            };
            throw error;
        }
    }

    // 5. Insert submission record
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
