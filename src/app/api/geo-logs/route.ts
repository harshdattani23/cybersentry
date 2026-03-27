import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');

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

        // Fetch the most recent 100 geo logs, ordered by created_at desc
        const { data, error } = await supabase
            .from('geo_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error: any) {
        console.error('[geo-logs] Error fetching geo logs:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
