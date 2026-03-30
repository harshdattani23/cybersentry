"use server";

import { headers } from 'next/headers';
import { createClient } from "@supabase/supabase-js";
import { getGeoFromIp } from "@/lib/geoip";

export async function publishArticleAction(insertPayload: any, token: string) {
    try {
        // --- Server-Side Validation ---
        if (!insertPayload.title || insertPayload.title.length < 10 || insertPayload.title.length > 150) {
            return { success: false, error: "Title must be between 10 and 150 characters." };
        }
        if (!insertPayload.summary || insertPayload.summary.length < 10 || insertPayload.summary.length > 500) {
            return { success: false, error: "Summary must be between 10 and 500 characters." };
        }
        const parsedContentText = insertPayload.content ? insertPayload.content.replace(/<[^>]+>/g, '').trim() : '';
        if (!insertPayload.content || parsedContentText.length > 2000 || insertPayload.content.length > 50000) {
            return { success: false, error: "Content is either empty, exceeds the 2000 character limit, or has too much HTML formatting." };
        }
        if (!insertPayload.source || insertPayload.source.length > 100) {
            return { success: false, error: "Source name is too long. Max 100 characters allowed." };
        }

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

export async function editArticleAction(articleId: string, authorId: string, updatePayload: any, token: string) {
    try {
        if (!articleId || !authorId) {
            return { success: false, error: "Invalid article or author ID" };
        }
        
        // --- Server-Side Validation ---
        if (!updatePayload.title || updatePayload.title.length < 10 || updatePayload.title.length > 150) {
            return { success: false, error: "Title must be between 10 and 150 characters." };
        }
        if (!updatePayload.summary || updatePayload.summary.length < 10 || updatePayload.summary.length > 500) {
            return { success: false, error: "Summary must be between 10 and 500 characters." };
        }
        const parsedContentText = updatePayload.content ? updatePayload.content.replace(/<[^>]+>/g, '').trim() : '';
        if (!updatePayload.content || parsedContentText.length > 2000 || updatePayload.content.length > 50000) {
            return { success: false, error: "Content is either empty, exceeds the 2000 character limit, or has too much HTML formatting." };
        }
        if (!updatePayload.source || updatePayload.source.length > 100) {
            return { success: false, error: "Source name is too long. Max 100 characters allowed." };
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            return { success: false, error: "Supabase environment variables missing on server." };
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
            global: { headers: { Authorization: `Bearer ${token}` } }
        });
        
        // Step 1: Secure check to verify author
        const { data: existingArticle, error: checkError } = await supabase
            .from("news")
            .select("author_id")
            .eq("id", articleId)
            .single();
            
        if (checkError || !existingArticle) {
            return { success: false, error: "Article not found or could not securely verify your ownership. It may have been removed." };
        }
        
        if (existingArticle.author_id !== authorId) {
            return { success: false, error: "Unauthorized: You are not the author of this article, so you cannot edit it." };
        }

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
        
        updatePayload.ip_address = ip_address;

        // Step 2: Update database
        const { data, error } = await supabase
            .from("news")
            .update(updatePayload)
            .eq("id", articleId)
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
