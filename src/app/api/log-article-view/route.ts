import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { getGeoFromIp } from "@/lib/geoip";

// Initialize a Supabase client using anon key (since service key isn't guaranteed here)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

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

        // 2. Fetch geo data (handles private IPs by falling back to public IP lookup)
        const geo = await getGeoFromIp(ip_address);
        const country = geo.country;
        const region = geo.state;
        const city = geo.city;

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

        // 4. Increment view count on the news article
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

        // 5. Insert geo log entry for this article view
        try {
            await supabase
                .from('geo_logs')
                .insert({
                    event_type: 'article_view',
                    article_id: article_id,
                    ip_address: ip_address,
                    country: country,
                    state: region,
                    city: city,
                    device_type: device_type,
                    user_agent: userAgent.substring(0, 500), // Truncate to avoid oversize
                });
        } catch (geoLogErr) {
            console.error('Geo log insert error (non-fatal):', geoLogErr);
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
