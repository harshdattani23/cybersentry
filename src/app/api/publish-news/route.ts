import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

// Initialize a Supabase client using anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            title,
            category,
            platform,
            summary,
            content,
            source_name,
            source_url,
            author_name,
            author_id,
            image_url,
        } = body;

        // Validate required fields (trim to catch whitespace-only strings)
        const requiredFields = { title, category, summary, content, source_name, author_name };
        const missingFields = Object.entries(requiredFields)
            .filter(([, value]) => !value || (typeof value === 'string' && value.trim() === ''))
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Build insert payload
        const insertPayload: Record<string, unknown> = {
            title,
            category,
            summary,
            content,
            source: source_name, // Schema column is called "source" not "source_name"
            author_email: author_name, // Schema column is "author_email", mapping author_name to it
            author_id: author_id || null, // Needs to be a valid UUID due to foreign key
            status: 'published',
            views: 0
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
    } catch (error) {
        console.error('[publish-news] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error', code: '' },
            { status: 500 }
        );
    }
}
