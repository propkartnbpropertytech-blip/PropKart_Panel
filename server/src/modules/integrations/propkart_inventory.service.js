import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { URL } from "url";

// Configuration for PropKart Live Inventory Key & Endpoint
const PROPKART_DEFAULT_API_URL = process.env.PROPKART_API_URL || "https://propkart.nbpropertytech.com/api/external/propkart";
const PROPKART_DEFAULT_API_KEY = process.env.PROPKART_API_KEY || "PK_LIVE_0ecb0c97b5da3f589c081699195471ebcc1d38c6d04441fb2db9b9efc3ea8686";

// Path to persistent listings storage
const DATA_DIR = path.join(process.cwd(), "src", "data");
const LISTINGS_FILE = path.join(DATA_DIR, "listings_store.json");

// In-memory status tracker
let syncStatus = {
    isConfigured: !!PROPKART_DEFAULT_API_KEY,
    lastSyncTime: null,
    totalSynced: 0,
    rentCount: 0,
    resaleCount: 0,
    lastError: null,
    apiUrl: PROPKART_DEFAULT_API_URL,
    maskedKey: PROPKART_DEFAULT_API_KEY ? `${PROPKART_DEFAULT_API_KEY.slice(0, 12)}...${PROPKART_DEFAULT_API_KEY.slice(-6)}` : "Not Configured",
};

function ensureDataDir() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    } catch (e) {
        console.error("Failed to ensure data directory:", e);
    }
}

function readListingsStore() {
    ensureDataDir();
    try {
        if (fs.existsSync(LISTINGS_FILE)) {
            const raw = fs.readFileSync(LISTINGS_FILE, "utf-8");
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Could not read listings file, starting fresh:", e.message);
    }
    return [];
}

function writeListingsStore(listings) {
    ensureDataDir();
    try {
        fs.writeFileSync(LISTINGS_FILE, JSON.stringify(listings, null, 2), "utf-8");
    } catch (e) {
        console.error("Failed to write to listings store:", e);
    }
}

/**
 * Perform HTTPS/HTTP GET request with timeout and error handling
 */
function fetchUrl(targetUrl, headers, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
        try {
            const parsed = new URL(targetUrl);
            const lib = parsed.protocol === "https:" ? https : http;

            const req = lib.request(
                targetUrl,
                {
                    method: "GET",
                    headers,
                    timeout: timeoutMs,
                    rejectUnauthorized: false, // In case of self-signed certs within local docker bridge
                },
                (res) => {
                    let body = "";
                    res.on("data", (chunk) => {
                        body += chunk;
                    });
                    res.on("end", () => {
                        resolve({
                            statusCode: res.statusCode,
                            contentType: res.headers["content-type"] || "",
                            body,
                        });
                    });
                }
            );

            req.on("error", (err) => reject(err));
            req.on("timeout", () => {
                req.destroy();
                reject(new Error(`Request timed out after ${timeoutMs}ms`));
            });

            req.end();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Fetch raw properties from PropKart API with smart fallback routing
 */
export async function fetchRawPropertiesFromPropKart(customUrl = null, customKey = null) {
    const primaryUrl = customUrl || process.env.PROPKART_API_URL || PROPKART_DEFAULT_API_URL;
    const apiKey = customKey || process.env.PROPKART_API_KEY || PROPKART_DEFAULT_API_KEY;

    // Candidate URLs to try in sequence:
    // 1. Primary configured URL (e.g. https://propkart.nbpropertytech.com/api/external/propkart)
    // 2. Direct VPS API domain (https://api-propkart.nbpropertytech.com/api/external/propkart)
    // 3. Docker container bridge URL (http://propkart-backend:5001/api/external/propkart)
    // 4. Localhost port fallback (http://localhost:5001/api/external/propkart)
    const candidateUrls = [
        primaryUrl,
        "https://api-propkart.nbpropertytech.com/api/external/propkart",
        "http://propkart-backend:5001/api/external/propkart",
        "http://127.0.0.1:5001/api/external/propkart",
    ];

    // Filter duplicate URLs
    const uniqueCandidates = [...new Set(candidateUrls)];

    const headers = {
        "x-api-key": apiKey,
        Authorization: `Bearer ${apiKey}`,
        "X-PROPKART-KEY": apiKey,
        Accept: "application/json",
        "User-Agent": "PropKart-Panel-Gateway/1.0",
    };

    let lastError = null;

    for (const url of uniqueCandidates) {
        try {
            console.log(`[PropKart Inventory] Attempting sync from: ${url}`);
            const resp = await fetchUrl(url, headers);

            // Verify if response is JSON (not HTML SPA fallback)
            const contentType = (resp.contentType || "").toLowerCase();
            if (resp.statusCode === 200 && contentType.includes("json")) {
                const parsed = JSON.parse(resp.body);
                if (parsed.success && Array.isArray(parsed.data)) {
                    console.log(`[PropKart Inventory] Successfully retrieved ${parsed.data.length} properties from ${url}`);
                    return parsed.data;
                }
            } else if (contentType.includes("html")) {
                console.log(`[PropKart Inventory] ${url} returned HTML fallback, trying next candidate endpoint...`);
            } else {
                console.warn(`[PropKart Inventory] ${url} returned HTTP ${resp.statusCode}`);
            }
        } catch (err) {
            console.warn(`[PropKart Inventory] Could not reach ${url}:`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error("Failed to retrieve valid JSON properties from any PropKart endpoint.");
}

/**
 * Normalizes an external PropKart property object into the official ListingProperty format
 */
export function normalizePropKartProperty(item) {
    if (!item) return null;

    // Transaction Type: Rent vs Re-sale
    const rawType = (item.listing_type || "").toLowerCase();
    let listing_type = "Rent";
    if (rawType.includes("sale") || rawType.includes("sell") || rawType.includes("buy")) {
        listing_type = "Re-sale";
    } else if (rawType.includes("pre")) {
        listing_type = "Pre-sales";
    }

    // Property Category: Residential, Commercial, Industrial, Land & Plot
    const rawCat = (item.category || item.property_type || "").toLowerCase();
    let property_category = "Residential";
    if (rawCat.includes("comm") || rawCat.includes("office") || rawCat.includes("shop") || rawCat.includes("retail")) {
        property_category = "Commercial";
    } else if (rawCat.includes("indus") || rawCat.includes("shed") || rawCat.includes("ware") || rawCat.includes("factory")) {
        property_category = "Industrial";
    } else if (rawCat.includes("plot") || rawCat.includes("land") || rawCat.includes("na land")) {
        property_category = "Land & Plot";
    }

    // Pricing & Display Format
    const rawPrice = Number(item.price) || 0;
    let price_display = `₹ ${rawPrice.toLocaleString("en-IN")}`;
    if (listing_type === "Rent") {
        price_display = `₹ ${rawPrice.toLocaleString("en-IN")} / mo`;
    } else if (rawPrice >= 10000000) {
        price_display = `₹ ${(rawPrice / 10000000).toFixed(2)} Cr`;
    } else if (rawPrice >= 100000) {
        price_display = `₹ ${(rawPrice / 100000).toFixed(2)} Lakhs`;
    }

    // Area calculation (super built-up, carpet, or plot)
    const area = Number(item.carpet_area || item.super_builtup_area || item.plot_area) || 1200;

    // Configuration / BHK
    let bhk = item.configuration || undefined;
    if (!bhk && item.bedrooms) {
        bhk = `${item.bedrooms} BHK`;
    } else if (!bhk && property_category === "Commercial") {
        bhk = item.property_type ? `${item.property_type} Unit` : "Commercial Unit";
    }

    // Extract Cloudinary Photos
    let imageList = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
        imageList = item.images
            .map((img) => {
                if (typeof img === "string") return img;
                if (img && typeof img === "object") return img.url || img.secure_url || img.public_url;
                return null;
            })
            .filter((url) => typeof url === "string" && url.startsWith("http"));
    }

    // Tasteful fallback imagery if no photos attached
    if (imageList.length === 0) {
        if (property_category === "Commercial") {
            imageList = ["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"];
        } else if (property_category === "Industrial") {
            imageList = ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"];
        } else if (property_category === "Land & Plot") {
            imageList = ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"];
        } else {
            imageList = ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"];
        }
    }

    // Videos
    let videoList = [];
    if (Array.isArray(item.videos) && item.videos.length > 0) {
        videoList = item.videos
            .map((vid) => (typeof vid === "string" ? vid : vid?.url))
            .filter((u) => typeof u === "string" && u.startsWith("http"));
    }

    // Locality & Address
    const locality = item.area || item.landmark || "Ahmedabad";
    const city = item.city || "Ahmedabad";
    const address = item.address || `${item.title}, ${locality}, ${city}`;

    // Description & Remarks
    const description = item.description || item.remarks || `${item.title} - Prime ${listing_type} ${property_category} property located in ${locality}, ${city}. Fully verified title and direct connectivity.`;

    // Amenities
    const amenities = Array.isArray(item.amenities) && item.amenities.length > 0
        ? item.amenities
        : ["24x7 Water", "Security", "Road Facing"];

    return {
        id: item.id,
        property_code: item.property_code || `PK-${item.id.slice(0, 6)}`,
        registration_code: item.property_code || `PK-${item.id.slice(0, 6)}`,
        title: item.title,
        description,
        listing_type,
        property_category,
        property_sub_type: item.property_type || (property_category === "Commercial" ? "Office" : "Apartment"),
        price: rawPrice,
        price_display,
        price_unit: listing_type === "Rent" ? "month" : "total",
        deposit: Number(item.deposit) || 0,
        maintenance: Number(item.maintenance) || 0,
        area,
        bhk,
        bedrooms: item.bedrooms || 0,
        bathrooms: item.bathrooms || 0,
        balconies: item.balconies || 0,
        floor_number: item.floor_no,
        total_floors: item.total_floor,
        furnishing: item.furnishing || "Unfurnished",
        facing: item.facing || "East",
        address,
        locality,
        city,
        pincode: item.pincode || "380054",
        images: imageList,
        videos: videoList,
        amenities,
        owner_name: item.owner_name || "Property Owner",
        owner_phone: item.owner_mobile || "",
        contact_person: item.broker_name || item.owner_name || "PropKart Operations Desk",
        contact_phone: item.owner_mobile || "+91 99742 09999",
        // Approval and Publication: Verified PropKart properties are marked Approved & Published
        approval_status: "Approved",
        is_approved: true,
        is_published: true,
        approved_at: item.updated_at || new Date().toISOString(),
        approved_by: "PropKart Live Gateway",
        source: "propkart_external_api",
        raw_data: item,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
    };
}

/**
 * Main Sync Routine: Pulls from PropKart API and merges into listings_store.json
 */
export async function syncPropKartLiveInventory() {
    try {
        console.log("[PropKart Gateway] Starting live inventory synchronization...");
        const rawItems = await fetchRawPropertiesFromPropKart();

        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            console.log("[PropKart Gateway] No properties returned from external API.");
            return {
                success: true,
                message: "No properties returned from external API.",
                count: 0,
            };
        }

        // Read current local/persisted listings store
        const existingListings = readListingsStore();

        // Index existing properties by ID
        const listingsMap = new Map();
        for (const p of existingListings) {
            if (p && p.id) {
                listingsMap.set(p.id, p);
            }
        }

        let syncedRent = 0;
        let syncedResale = 0;
        let upsertedCount = 0;

        for (const item of rawItems) {
            const normalized = normalizePropKartProperty(item);
            if (!normalized) continue;

            if (normalized.listing_type === "Rent") syncedRent++;
            if (normalized.listing_type === "Re-sale") syncedResale++;

            // If it already exists in the store, merge while preserving manual admin overrides
            if (listingsMap.has(normalized.id)) {
                const current = listingsMap.get(normalized.id);
                listingsMap.set(normalized.id, {
                    ...normalized,
                    // Preserve manual approval/publish states if admin explicitly toggled it
                    is_published: current.is_published !== undefined ? current.is_published : normalized.is_published,
                    is_approved: current.is_approved !== undefined ? current.is_approved : normalized.is_approved,
                    approval_status: current.approval_status || normalized.approval_status,
                });
            } else {
                listingsMap.set(normalized.id, normalized);
            }
            upsertedCount++;
        }

        // Convert map back to list
        const updatedList = Array.from(listingsMap.values());

        // Save back to JSON store
        writeListingsStore(updatedList);

        // Update in-memory tracker
        syncStatus = {
            ...syncStatus,
            lastSyncTime: new Date().toISOString(),
            totalSynced: upsertedCount,
            rentCount: syncedRent,
            resaleCount: syncedResale,
            lastError: null,
        };

        console.log(`[PropKart Gateway] Synchronization complete! Synced ${upsertedCount} properties (${syncedRent} Rent, ${syncedResale} Re-sale). Total store size: ${updatedList.length}`);

        return {
            success: true,
            message: `Successfully synchronized ${upsertedCount} live properties from Hostinger VPS.`,
            totalSynced: upsertedCount,
            rentCount: syncedRent,
            resaleCount: syncedResale,
            totalInventory: updatedList.length,
            lastSyncTime: syncStatus.lastSyncTime,
        };
    } catch (err) {
        console.error("[PropKart Gateway] Synchronization error:", err);
        syncStatus.lastError = err.message;
        throw err;
    }
}

/**
 * Returns current status of the PropKart External API Integration
 */
export function getPropKartIntegrationStatus() {
    return {
        ...syncStatus,
        currentTime: new Date().toISOString(),
    };
}
