import * as service from "./dynamic_forms.service.js";
import * as repo from "./dynamic_forms.repository.js";
import { uploadFileToStorage } from "./dynamic_forms.upload.js";

// ==========================================
// PUBLIC CONTROLLERS (PropKart Connect)
// ==========================================

/**
 * GET /api/v1/forms/active
 * Get current published form schema for public Connect app
 */
export async function getActiveForm(req, res, next) {
    try {
        const slug = req.query.slug || "property-registration";
        const formSchema = await repo.getActiveFormBySlug(slug);

        return res.status(200).json({
            success: true,
            message: "Active form schema retrieved successfully.",
            data: formSchema,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/form-submissions/upload-media
 * Public upload endpoint for photos and videos
 */
export async function uploadSubmissionMedia(req, res, next) {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded.",
                errorCode: "NO_FILES",
            });
        }

        const uploadedMedia = [];
        for (const file of req.files) {
            const mediaRecord = await uploadFileToStorage(file, "submissions");
            uploadedMedia.push(mediaRecord);
        }

        return res.status(201).json({
            success: true,
            message: `Successfully uploaded ${uploadedMedia.length} files.`,
            data: uploadedMedia,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/form-submissions
 * Submit property registration from PropKart Connect
 */
export async function submitPropertyForm(req, res, next) {
    try {
        const { version_id, fields, media } = req.body;
        const ipAddress = req.ip || req.headers["x-forwarded-for"] || "";
        const userAgent = req.headers["user-agent"] || "";

        const submission = await service.submitRegistrationForm({
            versionId: version_id,
            fields,
            media: media || [],
            ipAddress,
            userAgent,
        });

        return res.status(201).json({
            success: true,
            message: "Property registration submitted successfully! Our team will contact you shortly.",
            data: {
                registration_code: submission.registration_code,
                submission_id: submission.id,
                status: submission.status,
                created_at: submission.created_at,
            },
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(422).json({
                success: false,
                message: err.message,
                errorCode: "VALIDATION_FAILED",
                errors: err.fields,
            });
        }
        next(err);
    }
}

/**
 * GET /api/v1/form-submissions/verify/:code
 * Public verification endpoint
 */
export async function verifyRegistrationCode(req, res, next) {
    try {
        const { code } = req.params;
        const match = await repo.getSubmissionByRegistrationCode(code);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: "Registration not found.",
                errorCode: "NOT_FOUND",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                registration_code: match.registration_code,
                status: match.status,
                created_at: match.created_at,
                property_type: match.property_type,
                city: match.city,
            },
        });
    } catch (err) {
        next(err);
    }
}

// ==========================================
// ADMIN / PANEL CONTROLLERS (PropKart Panel)
// ==========================================

/**
 * GET /api/v1/admin/submissions
 * Search, filter, and paginate submissions
 */
export async function listSubmissions(req, res, next) {
    try {
        const result = await repo.getSubmissions(req.query);
        return res.status(200).json({
            success: true,
            message: "Submissions retrieved.",
            data: result.submissions,
            pagination: result.pagination,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/admin/submissions/stats
 * Dashboard KPI counts
 */
export async function getSubmissionStats(req, res, next) {
    try {
        const stats = await repo.getSubmissionKPIStats();
        return res.status(200).json({
            success: true,
            message: "Submission KPI stats retrieved.",
            data: stats,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/admin/submissions/:id
 * Full submission detail with dynamic fields, media, notes, and audit log
 */
export async function getSubmissionById(req, res, next) {
    try {
        const { id } = req.params;
        const detail = await repo.getSubmissionDetailById(id);

        return res.status(200).json({
            success: true,
            message: "Submission detail retrieved.",
            data: detail,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/v1/admin/submissions/:id/status
 * Update submission workflow status
 */
export async function updateStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status, note } = req.body;
        const updated = await repo.updateSubmissionStatus(id, status, req.user?.id, note);

        return res.status(200).json({
            success: true,
            message: `Status updated to ${status}.`,
            data: updated,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/v1/admin/submissions/:id/assign
 * Assign submission to telecaller
 */
export async function assignTelecaller(req, res, next) {
    try {
        const { id } = req.params;
        const { assigned_to } = req.body;
        const updated = await repo.assignSubmission(id, assigned_to, req.user?.id);

        return res.status(200).json({
            success: true,
            message: "Submission assignment updated.",
            data: updated,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/v1/admin/submissions/:id/data
 * Telecaller updates or enriches dynamic property fields
 */
export async function updateData(req, res, next) {
    try {
        const { id } = req.params;
        const { fields } = req.body;
        const updated = await repo.updateSubmissionData(id, fields, req.user?.id);

        return res.status(200).json({
            success: true,
            message: "Submission data updated successfully.",
            data: updated,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/admin/submissions/:id/notes
 * Add telecaller call log note
 */
export async function addNote(req, res, next) {
    try {
        const { id } = req.params;
        const { note, call_status } = req.body;
        const newNote = await repo.addTelecallerNote(id, req.user?.id, note, call_status);

        return res.status(201).json({
            success: true,
            message: "Telecaller note added.",
            data: newNote,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/admin/submissions/:id/convert-to-property
 * Convert verified submission into main properties table
 */
export async function convertToProperty(req, res, next) {
    try {
        const { id } = req.params;
        const result = await repo.convertSubmissionToProperty(id, req.user?.id);

        return res.status(200).json({
            success: true,
            message: "Property successfully created in inventory!",
            data: result,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/admin/forms/versions/:version_id/schema
 * Form Builder: get full schema for editor
 */
export async function getVersionSchema(req, res, next) {
    try {
        const { version_id } = req.params;
        const schema = await repo.getFormVersionSchema(version_id);

        return res.status(200).json({
            success: true,
            message: "Version schema retrieved.",
            data: schema,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * PUT /api/v1/admin/forms/versions/:version_id/schema
 * Form Builder: save sections and fields
 */
export async function saveVersionSchema(req, res, next) {
    try {
        const { version_id } = req.params;
        const { sections } = req.body;
        const updated = await repo.saveDraftVersionSchema(version_id, sections, req.user?.id);

        return res.status(200).json({
            success: true,
            message: "Form schema saved successfully.",
            data: updated,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * PUT /api/v1/admin/forms/fields
 * Simple direct form fields update
 */
export async function saveActiveFields(req, res, next) {
    try {
        const { fields } = req.body;
        const updated = await repo.saveActiveFormFields(fields || [], req.user?.id);

        return res.status(200).json({
            success: true,
            message: "Form fields updated successfully!",
            data: updated,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/admin/forms/versions/:version_id/publish
 * Form Builder: publish draft version
 */
export async function publishVersion(req, res, next) {
    try {
        const { version_id } = req.params;
        const published = await repo.publishFormVersion(version_id, req.user?.id);

        return res.status(200).json({
            success: true,
            message: `Version ${published.version_number} is now live and published!`,
            data: published,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/admin/forms/:form_id/versions
 * Form Builder: create new draft version
 */
export async function createNewDraftVersion(req, res, next) {
    try {
        const { form_id } = req.params;
        const { changelog } = req.body;
        const draft = await repo.createDraftVersion(form_id, req.user?.id, changelog);

        return res.status(201).json({
            success: true,
            message: `Draft version ${draft.version_number} created successfully.`,
            data: draft,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * DELETE /api/v1/admin/submissions/:id
 * Permanently delete property entry and cascade media
 */
export async function deleteSubmission(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await repo.deleteSubmissionRecord(id, req.user?.id);

        return res.status(200).json({
            success: true,
            message: "Property submission deleted successfully.",
            data: deleted,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/admin/submissions/bulk-delete
 * Bulk delete property submissions
 */
export async function bulkDeleteSubmissions(req, res, next) {
    try {
        const { ids } = req.body;
        const result = await repo.bulkDeleteSubmissions(ids, req.user?.id);

        return res.status(200).json({
            success: true,
            message: `Successfully deleted ${result.count} properties.`,
            data: result,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/v1/admin/submissions/bulk-status
 * Bulk update submission status
 */
export async function bulkUpdateStatus(req, res, next) {
    try {
        const { ids, status } = req.body;
        const result = await repo.bulkUpdateSubmissionStatus(ids, status, req.user?.id);

        return res.status(200).json({
            success: true,
            message: `Successfully updated ${result.count} properties to "${status}".`,
            data: result,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/v1/admin/forms/assistance-phone
 * Update header assistance phone number
 */
export async function updateAssistancePhone(req, res, next) {
    try {
        const { assistance_phone } = req.body;
        const updated = await repo.updateAssistancePhone(assistance_phone);

        return res.status(200).json({
            success: true,
            message: "Assistance phone number updated successfully.",
            data: updated,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/admin/submissions/export-zip
 * Download complete ZIP archive with properties report and all photos
 */
export async function exportSubmissionsZip(req, res, next) {
    try {
        await repo.exportSubmissionsZipStream(res, req.query);
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/admin/submissions/export-csv
 * Download properties CSV data spreadsheet
 */
export async function exportSubmissionsCsv(req, res, next) {
    try {
        await repo.exportSubmissionsCsv(res, req.query);
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/admin/users
 * Returns system users for assignments
 */
export async function listActiveUsers(req, res, next) {
    try {
        const users = await repo.getActiveUsers();
        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (err) {
        next(err);
    }
}
