import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const isBrowser = typeof window !== 'undefined';

const createSupabaseClient = () => {
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: isBrowser,
            autoRefreshToken: isBrowser,
            detectSessionInUrl: isBrowser,
        }
    });
};

// Use a global variable to store the singleton instance in the browser
// This prevents Next.js Turbopack HMR from creating multiple active Supabase clients 
// that fight over the same session lock ("Lock broken by another request with the 'steal' option")
export const supabase = (() => {
    if (!isBrowser) return createSupabaseClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalStore = window as any;
    if (!globalStore._supabaseClient) {
        globalStore._supabaseClient = createSupabaseClient();
    }
    return globalStore._supabaseClient;
})();
