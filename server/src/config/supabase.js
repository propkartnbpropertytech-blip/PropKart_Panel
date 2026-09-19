import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:8000";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "local-standalone-key";

if (!supabaseKey) {
    console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined in environment.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
    realtime: {
        timeout: 1000,
    },
});

export default supabase;
