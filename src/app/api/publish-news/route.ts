import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { getGeoFromIp } from "@/lib/geoip";

// Constants for initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        
        // Initialize Supabase with the incoming auth header to bypass RLS restrictions securely
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            global: {
                headers: authHeader ? { Authorization: authHeader } : {}
            }
        });

        const body = await request.json();

        const {
            title,
            category,
            platform,
            summary,
            content,
            source,
            source_url,
            author_email,
            author_id,
            image_url,
            status,
            views
        } = body;

        // Validate required fields (trim to catch whitespace-only strings)
        const requiredFields = { title, category, summary, content, source, author_email };
        const missingFields = Object.entries(requiredFields)
            .filter(([, value]) => !value || (typeof value === 'string' && value.trim() === ''))
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Capture publisher's IP address securely
        const forwarded = request.headers.get("x-forwarded-for");
        const realIp = request.headers.get("x-real-ip");
        let ip_address = "Unknown";
        
        if (forwarded) {
            ip_address = forwarded.split(',')[0].trim();
        } else if (realIp) {
            ip_address = realIp;
        }

        // Fetch geo data for the publisher (handles private IPs automatically)
        const geo = await getGeoFromIp(ip_address);
        const country = geo.country;
        const state = geo.state;
        const city = geo.city;

        // Build exact insert payload mapping securely
        const insertPayload: Record<string, unknown> = {
            title,
            category,
            platform: platform || null,
            summary,
            content,
            source,
            source_url: source_url || null,
            author_email,
            author_id: author_id || null,
            status: status || 'published',
            views: views || 0,
            ip_address: ip_address
        };

        if (image_url) {
            insertPayload.image_url = image_url;
        } else {
            insertPayload.image_url = "";
        }

        console.log('[publish-news] Inserting article with payload:', insertPayload);

        const { data: docRef, error: insertError } = await supabase
            .from("news")
            .insert(insertPayload)
            .select("id")
            .single();

        if (insertError) throw insertError;

        console.log('[publish-news] Article inserted successfully:', docRef?.id);

        // Log publisher geo data into geo_logs table
        try {
            const userAgent = request.headers.get('user-agent') || '';
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
                    article_id: docRef?.id || null,
                    user_id: author_id || null,
                    user_email: author_email || null,
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

        return NextResponse.json(
            { success: true, data: { id: docRef?.id, ...insertPayload } },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('[publish-news] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Internal Server Error', fullError: error },
            { status: 500 }
        );
    }
}
