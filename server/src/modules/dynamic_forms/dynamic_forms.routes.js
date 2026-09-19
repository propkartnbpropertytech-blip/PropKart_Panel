import { Router } from "express";
import * as controller from "./dynamic_forms.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/zodValidate.middleware.js";
import { uploadMiddleware } from "./dynamic_forms.upload.js";
import {
    submitFormSchema,
    updateSubmissionStatusSchema,
    assignSubmissionSchema,
    addTelecallerNoteSchema,
    updateSubmissionDataSchema,
    createFormVersionSchema,
    saveFormSchema,
} from "./dynamic_forms.schemas.js";
import { apiRateLimit } from "../../security/rateLimits.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES (PropKart Connect)
// ==========================================

// Get published active form schema
router.get("/forms/active", controller.getActiveForm);

// Upload photos & videos (up to 50 photos, up to 30 videos per submission)
router.post(
    "/form-submissions/upload-media",
    uploadMiddleware.array("files", 50),
    controller.uploadSubmissionMedia
);

// Submit form
router.post(
    "/form-submissions",
    apiRateLimit,
    validate(submitFormSchema),
    controller.submitPropertyForm
);

// Verify registration code
router.get("/form-submissions/verify/:code", controller.verifyRegistrationCode);

// ==========================================
// ADMIN / PANEL ROUTES (PropKart Panel)
// Protected by JWT and RBAC
// ==========================================

const panelRoles = requireRole("Super Admin", "Admin", "Telecaller", "Sales");

// Submissions List & Dashboard Stats
router.get("/admin/submissions", authenticate, panelRoles, controller.listSubmissions);
router.get("/admin/submissions/stats", authenticate, panelRoles, controller.getSubmissionStats);
router.get("/admin/submissions/:id", authenticate, panelRoles, controller.getSubmissionById);

// Submission Workflow Updates
router.patch(
    "/admin/submissions/:id/status",
    authenticate,
    panelRoles,
    validate(updateSubmissionStatusSchema),
    controller.updateStatus
);

router.patch(
    "/admin/submissions/:id/assign",
    authenticate,
    panelRoles,
    validate(assignSubmissionSchema),
    controller.assignTelecaller
);

router.patch(
    "/admin/submissions/:id/data",
    authenticate,
    panelRoles,
    validate(updateSubmissionDataSchema),
    controller.updateData
);

router.post(
    "/admin/submissions/:id/notes",
    authenticate,
    panelRoles,
    validate(addTelecallerNoteSchema),
    controller.addNote
);

router.post(
    "/admin/submissions/:id/convert-to-property",
    authenticate,
    panelRoles,
    controller.convertToProperty
);

// Simple Form Configuration Endpoint
router.put(
    "/admin/forms/fields",
    authenticate,
    requireRole("Super Admin", "Admin"),
    controller.saveActiveFields
);

router.get(
    "/admin/forms/versions/:version_id/schema",
    authenticate,
    panelRoles,
    controller.getVersionSchema
);

router.put(
    "/admin/forms/versions/:version_id/schema",
    authenticate,
    requireRole("Super Admin", "Admin"),
    validate(saveFormSchema),
    controller.saveVersionSchema
);

router.post(
    "/admin/forms/versions/:version_id/publish",
    authenticate,
    requireRole("Super Admin", "Admin"),
    controller.publishVersion
);

router.post(
    "/admin/forms/:form_id/versions",
    authenticate,
    requireRole("Super Admin", "Admin"),
    validate(createFormVersionSchema),
    controller.createNewDraftVersion
);

export default router;
