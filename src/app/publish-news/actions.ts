"use server";

import { headers } from 'next/headers';
import { createClient } from "@supabase/supabase-js";
import { getGeoFromIp } from "@/lib/geoip";

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

        // Fetch geo data for the publisher (handles private IPs automatically)
        const geo = await getGeoFromIp(ip_address);
        const country = geo.country;
        const state = geo.state;
        const city = geo.city;

        const { data, error } = await supabase
            .from("news")
            .insert(insertPayload)
            .select("id")
            .single();

        if (error) {
            return { success: false, error: error.message || JSON.stringify(error) };
        }

        // Log publisher geo data into geo_logs table
        try {
            const userAgent = headersList.get("user-agent") || '';
            let device_type = 'desktop';
            if (userAgent.includes('Mobile')) {
                device_type = 'mobile';
            } else if (userAgent.includes('Tablet')) {
                device_type = 'tablet';
            }

            await supabase
                .from('geo_logs')
                .insert({
                    event_type: 'article_publish',
                    article_id: data?.id || null,
                    user_id: insertPayload.author_id || null,
                    user_email: insertPayload.author_email || null,
                    ip_address: ip_address,
                    country: country,
                    state: state,
                    city: city,
                    device_type: device_type,
                    user_agent: userAgent.substring(0, 500),
                });
        } catch (geoLogErr) {
            console.error('Geo log insert error for publisher (non-fatal):', geoLogErr);
        }

        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e?.message || "Internal Server Action crash." };
    }
}
