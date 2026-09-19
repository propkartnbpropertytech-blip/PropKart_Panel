import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import supabase from "../../config/supabase.js";

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/ogg",
    "video/x-matroska",
]);

// Multer in-memory storage for streaming directly to Supabase storage or disk
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 60 * 1024 * 1024, // 60MB max file size (videos up to 50MB, safety buffer)
        files: 50, // max 50 files per single upload batch
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, MP4, WEBM, MOV.`));
        }
    },
});

/**
 * Upload buffer to Supabase Storage 'property-media' bucket
 */
export async function uploadFileToStorage(file, folder = "submissions") {
    const isVideo = file.mimetype.startsWith("video/");
    const ext = path.extname(file.originalname).toLowerCase() || (isVideo ? ".mp4" : ".jpg");
    const filename = `${crypto.randomUUID()}${ext}`;
    const storagePath = `${folder}/${isVideo ? "videos" : "photos"}/${filename}`;

    let publicUrl = "";

    try {
        // 1. Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from("property-media")
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: pubData } = supabase.storage
            .from("property-media")
            .getPublicUrl(storagePath);

        publicUrl = pubData?.publicUrl || "";
    } catch (storageErr) {
        console.warn("Supabase storage upload fallback to local:", storageErr.message);

        // Fallback: save to local uploads folder
        const localUploadsDir = path.join(process.cwd(), "public", "uploads", folder);
        if (!fs.existsSync(localUploadsDir)) {
            fs.mkdirSync(localUploadsDir, { recursive: true });
        }
        const localFilePath = path.join(localUploadsDir, filename);
        fs.writeFileSync(localFilePath, file.buffer);

        const baseUrl = process.env.APP_URL || "http://localhost:5050";
        publicUrl = `${baseUrl}/uploads/${folder}/${filename}`;
    }

    return {
        media_type: isVideo ? "video" : "photo",
        storage_path: storagePath,
        public_url: publicUrl,
        original_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
    };
}
