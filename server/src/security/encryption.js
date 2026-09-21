import crypto from 'crypto';

const PRIMARY_SECRET = process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || 'propkart-forms-standalone-secret-key-2026';
const FALLBACK_SECRETS = [
    'propkart-forms-standalone-secret-key-2026',
    'propconnect-forms-standalone-secret-key-2026',
    'propkart-standalone-secret-key-2026-super-secure',
];

// Derive 32-byte keys via SHA-256
const PRIMARY_KEY = crypto.createHash('sha256').update(String(PRIMARY_SECRET)).digest();
const CANDIDATE_KEYS = [
    PRIMARY_KEY,
    ...FALLBACK_SECRETS.map((s) => crypto.createHash('sha256').update(String(s)).digest()),
];

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc:v1:';

/**
 * Encrypts a string using AES-256-GCM with the active primary key
 */
export function encryptString(text) {
    if (text === null || text === undefined || text === '') {
        return text;
    }
    const str = String(text);
    if (str.startsWith(PREFIX)) {
        return str; // Already encrypted
    }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, PRIMARY_KEY, iv);
    let encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string, trying candidate keys
 */
export function decryptString(text) {
    if (text === null || text === undefined || text === '') {
        return text;
    }
    const str = String(text);
    if (!str.startsWith(PREFIX)) {
        return str; // Backward compatibility for legacy unencrypted text
    }

    const parts = str.slice(PREFIX.length).split(':');
    if (parts.length !== 3) {
        return str;
    }
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    for (const key of CANDIDATE_KEYS) {
        try {
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (err) {
            // Try next candidate key
        }
    }

    console.error('Decryption failed for ciphertext with all candidate keys');
    return str;
}

/**
 * Encrypts an arbitrary object into a secure wrapper
 */
export function encryptJson(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (obj._encrypted === true) {
        return obj;
    }
    const jsonStr = JSON.stringify(obj);
    const encryptedStr = encryptString(jsonStr);
    return {
        _encrypted: true,
        payload: encryptedStr,
    };
}

/**
 * Decrypts an object if it was encrypted
 */
export function decryptJson(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (obj._encrypted === true && typeof obj.payload === 'string') {
        try {
            const decryptedStr = decryptString(obj.payload);
            return JSON.parse(decryptedStr);
        } catch (err) {
            console.error('Decryption failed for JSON payload:', err.message);
            return obj;
        }
    }
    return obj;
}
