"use server";

import { headers } from 'next/headers';
import { createClient } from "@supabase/supabase-js";

export async function publishArticleAction(insertPayload: any, token: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            return { success: false, error: "Supabase environment variables missing on server." };
        }

        // Initialize a clean, sterile Supabase instance just for this transaction
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

        // Capture publisher's IP address asynchronously
        const headersList = await headers();
        const forwarded = headersList.get("x-forwarded-for");
        const realIp = headersList.get("x-real-ip");
        let ip_address = "Unknown";
        
        if (forwarded) {
            ip_address = forwarded.split(',')[0].trim();
        } else if (realIp) {
            ip_address = realIp;
        }
        
        // Append IP address to the article payload
        insertPayload.ip_address = ip_address;

        const { data, error } = await supabase
            .from("news")
            .insert(insertPayload)
            .select("id")
            .single();

        if (error) {
            return { success: false, error: error.message || JSON.stringify(error) };
        }

        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e?.message || "Internal Server Action crash." };
    }
}
