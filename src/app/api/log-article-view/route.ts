import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

// Initialize a Supabase client using anon key (since service key isn't guaranteed here)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { article_id } = body;

        if (!article_id) {
            return NextResponse.json({ success: false, error: 'Missing article_id' }, { status: 400 });
        }

        // 1. Capture raw IP
        const forwarded = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');

        let ip_address = 'Unknown';
        if (forwarded) {
            ip_address = forwarded.split(',')[0].trim();
        } else if (realIp) {
            ip_address = realIp;
        }

        // 2. Fetch geo data using a free IP API (with 3s timeout)
        let country = 'Unknown';
        let region = 'Unknown';
        let city = 'Unknown';

        if (ip_address === '::1' || ip_address === '127.0.0.1' || ip_address === 'Unknown') {
            country = 'Localhost';
            region = 'Localhost';
            city = 'Localhost';
        } else {
            try {
                const geoRes = await fetch(`https://ipapi.co/${ip_address}/json/`, {
                    signal: AbortSignal.timeout(3000),
                });
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    if (!geoData.error) {
                        city = geoData.city || 'Unknown';
                        region = geoData.region || 'Unknown';
                        country = geoData.country_name || 'Unknown';
                    }
                }
            } catch (err) {
                console.error('Geo API fetch error (will store view with Unknown location):', err);
                // Keep defaults — do NOT crash, still store the view
            }
        }

        // 3. Keep device type detection from user-agent
        const userAgent = request.headers.get('user-agent') || '';
        let device_type = 'desktop';

        if (userAgent.includes('Mobile')) {
            device_type = 'mobile';
        } else if (userAgent.includes('Tablet')) {
            device_type = 'tablet';
        } else {
            device_type = 'desktop';
        }

        // Since we migrated to Supabase and don't have an article_views table 
        // in the current schema snapshot, we will just fetch the current view 
        // count and increment it. (In production, an RPC is better to prevent race conditions).
        try {
            const { data: article } = await supabase
                .from('news')
                .select('views')
                .eq('id', article_id)
                .single();

            if (article) {
                await supabase
                    .from('news')
                    .update({ views: (article.views || 0) + 1 })
                    .eq('id', article_id);
            }
        } catch (updateErr) {
            console.error('Supabase update views error:', updateErr);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in log-article-view route:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
