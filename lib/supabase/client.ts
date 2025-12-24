import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

/**
 * Browser-side Supabase client with anonymous key.
 * Use this for client components that need direct database access.
 * Respects RLS policies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
