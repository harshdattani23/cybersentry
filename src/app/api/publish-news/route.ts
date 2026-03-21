import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

// Constants for initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        
        // Initialize Supabase with the incoming auth header to bypass RLS restrictions securely
        const supabase = createClient(supabaseUrl, supabaseKey, {
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
            views: views || 0
        };

        // Note: The schema for news has 'status' and 'platform' logic differences, 
        // we'll adapt to 'source' and 'category'.

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
