import { z } from "zod";

export const submitFormSchema = z.object({
    body: z.object({
        version_id: z.string().uuid("Invalid form version ID"),
        fields: z.record(z.any()).default({}),
        media: z.array(
            z.object({
                field_key: z.string().min(1),
                media_type: z.enum(["photo", "video", "document"]),
                storage_path: z.string().min(1),
                public_url: z.string().url("Invalid media URL"),
                original_name: z.string().optional(),
                file_size: z.number().optional(),
                mime_type: z.string().optional(),
                display_order: z.number().optional().default(0),
            })
        ).optional().default([]),
    }),
});

export const updateSubmissionStatusSchema = z.object({
    body: z.object({
        status: z.enum([
            "New",
            "Contact Pending",
            "Contacted",
            "Details Verified",
            "In Progress",
            "Converted",
            "Not Interested",
            "Rejected",
            "Archived"
        ]),
        note: z.string().optional(),
    }),
});

export const assignSubmissionSchema = z.object({
    body: z.object({
        assigned_to: z.string().uuid("Invalid user ID").nullable(),
    }),
});

export const addTelecallerNoteSchema = z.object({
    body: z.object({
        note: z.string().min(1, "Note cannot be empty").max(2000, "Note too long"),
        call_status: z.string().optional(),
    }),
});

export const updateSubmissionDataSchema = z.object({
    body: z.object({
        fields: z.record(z.any()),
    }),
});

export const createFormVersionSchema = z.object({
    body: z.object({
        changelog: z.string().optional().default("New draft version"),
    }),
});

export const saveFormSchema = z.object({
    body: z.object({
        sections: z.array(
            z.object({
                id: z.string().optional(),
                title: z.string().min(1, "Section title is required"),
                description: z.string().optional().nullable(),
                display_order: z.number().default(0),
                fields: z.array(
                    z.object({
                        id: z.string().optional(),
                        field_key: z.string().min(1, "Field key is required").regex(/^[a-z0-9_]+$/, "Field key must be lowercase letters, numbers, and underscores"),
                        label: z.string().min(1, "Field label is required"),
                        field_type: z.string().min(1, "Field type is required"),
                        placeholder: z.string().optional().nullable(),
                        help_text: z.string().optional().nullable(),
                        description: z.string().optional().nullable(),
                        is_required: z.boolean().default(false),
                        is_active: z.boolean().default(true),
                        display_order: z.number().default(0),
                        validation_rules: z.record(z.any()).default({}),
                        options: z.array(
                            z.object({
                                label: z.string(),
                                value: z.any(),
                            })
                        ).default([]),
                        conditional_visibility: z.record(z.any()).optional().nullable(),
                    })
                ).default([]),
            })
        ).min(1, "At least one section is required"),
    }),
});
