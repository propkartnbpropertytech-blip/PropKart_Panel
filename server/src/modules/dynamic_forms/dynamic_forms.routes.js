import { Router } from "express";
import * as controller from "./dynamic_forms.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/zodValidate.middleware.js";
import { uploadMiddleware } from "./dynamic_forms.upload.js";
import {
    submitFormSchema,
    updateSubmissionStatusSchema,
    updateAssistancePhoneSchema,
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

// Upload photos & videos (up to 100 photos, up to 50 videos per submission)
router.post(
    "/form-submissions/upload-media",
    uploadMiddleware.array("files", 100),
    controller.uploadSubmissionMedia
);
router.post(
    "/listings/upload-media",
    uploadMiddleware.array("files", 100),
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

// Check if mobile number is duplicate
router.get("/form-submissions/check-phone", controller.checkPhoneDuplicate);

// Public Property Showcase
router.get("/form-submissions/public-property/:code", controller.getPublicPropertyShowcase);

// ==========================================
// ADMIN / PANEL ROUTES (PropKart Panel)
// Protected by JWT and RBAC
// ==========================================

const panelRoles = requireRole("Super Admin", "Admin", "Telecaller", "Sales");

// Submissions List & Dashboard Stats
router.get("/admin/submissions", authenticate, panelRoles, controller.listSubmissions);
router.get("/admin/submissions/stats", authenticate, panelRoles, controller.getSubmissionStats);
router.get("/admin/users", authenticate, panelRoles, controller.listActiveUsers);
router.get("/admin/submissions/export/zip", authenticate, panelRoles, controller.exportSubmissionsZip);
router.get("/admin/submissions/export/csv", authenticate, panelRoles, controller.exportSubmissionsCsv);
router.get("/admin/submissions/:id", authenticate, panelRoles, controller.getSubmissionById);

// Permanently Delete Submission
router.delete("/admin/submissions/:id", authenticate, panelRoles, controller.deleteSubmission);

// Bulk Actions: Delete & Status
router.post("/admin/submissions/bulk-delete", authenticate, panelRoles, controller.bulkDeleteSubmissions);
router.patch("/admin/submissions/bulk-status", authenticate, panelRoles, controller.bulkUpdateStatus);

// Update Header Assistance Phone
router.patch(
    "/admin/forms/assistance-phone",
    authenticate,
    requireRole("Super Admin", "Admin"),
    validate(updateAssistancePhoneSchema),
    controller.updateAssistancePhone
);

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

// ==========================================
// LISTINGS & PRE-SALES INVENTORY ROUTES
// ==========================================
router.get("/listings/public", controller.getPublicListings);
router.get("/listings/all", controller.getListings);
router.get("/listings/:id", controller.getListingById);
router.put("/listings/:id", controller.updateListing);
router.patch("/listings/:id", controller.updateListing);
router.delete("/listings/:id", controller.deleteListing);
router.patch("/listings/:id/toggle", controller.toggleListingVisibility);
router.patch("/listings/:id/approve", controller.approveListing);
router.patch("/listings/:id/reject", controller.rejectListing);
router.post("/listings/presales", controller.createPreSalesListing);
router.post("/listings/sync-submissions", controller.syncSubmissions);
router.get("/forms/presales-schema", controller.getPreSalesSchema);
router.put("/forms/presales-schema", controller.savePreSalesSchema);
router.get("/forms/assistance-phone", controller.getAssistancePhone);
router.patch("/forms/assistance-phone", controller.updateAssistancePhone);

// Admin protected routes
router.get("/admin/listings", authenticate, panelRoles, controller.getListings);
router.get("/admin/listings/:id", authenticate, panelRoles, controller.getListingById);
router.put("/admin/listings/:id", authenticate, panelRoles, controller.updateListing);
router.patch("/admin/listings/:id", authenticate, panelRoles, controller.updateListing);
router.delete("/admin/listings/:id", authenticate, panelRoles, controller.deleteListing);
router.patch("/admin/listings/:id/toggle", authenticate, panelRoles, controller.toggleListingVisibility);
router.patch("/admin/listings/:id/approve", authenticate, panelRoles, controller.approveListing);
router.patch("/admin/listings/:id/reject", authenticate, panelRoles, controller.rejectListing);
router.post("/admin/listings/presales", authenticate, panelRoles, controller.createPreSalesListing);
router.post("/admin/listings/sync-submissions", authenticate, panelRoles, controller.syncSubmissions);
router.get("/admin/forms/presales-schema", authenticate, panelRoles, controller.getPreSalesSchema);
router.put("/admin/forms/presales-schema", authenticate, requireRole("Super Admin", "Admin"), controller.savePreSalesSchema);

// PropKart External API Integration Gateway
router.get("/integrations/propkart/status", controller.getPropKartStatus);
router.post("/integrations/propkart/sync", controller.syncPropKartInventory);
router.get("/admin/integrations/propkart/status", controller.getPropKartStatus);
router.post("/admin/integrations/propkart/sync", controller.syncPropKartInventory);

export default router;
