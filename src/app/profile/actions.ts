"use server";

import { createClient } from "@supabase/supabase-js";

export async function updateProfileAction(profileData: any, token: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            return { success: false, error: "Supabase environment variables missing on server." };
        }

        // Initialize Supabase on the server with the user's token
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        // Perform the upsert operation (id is required in profileData)
        const { data, error } = await supabase
            .from("users")
            .upsert(profileData)
            .select("*")
            .single();

        if (error) {
            console.error("Server Action Update Error:", error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }

        return { success: true, data };
    } catch (e: any) {
        console.error("Server Action Exception:", e);
        return { success: false, error: e?.message || "Internal Server Action crash." };
    }
}
