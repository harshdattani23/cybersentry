"use server";

import { createClient } from "@supabase/supabase-js";

export async function submitReportAction(formData: FormData) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            return { success: false, error: "Supabase environment variables missing on server." };
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        // Initialize dynamic payload
        let insertPayload: any = {
            title: (formData.get('title') as string) || "Untitled Fraud Report",
            category: formData.get('category') as string,
            platform: formData.get('platform') as string,
            description: formData.get('description') as string,
            phone: formData.get('phone') as string,
            url: formData.get('url') as string,
            priority: 'low',
            status: 'under_review',
            is_public: true,
        };

        const file = formData.get('file') as File | null;
        let uploadedFileUrl = "";

        if (file && file.size > 0) {
            try {
                const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
                const fileName = `evidence-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                // Map extension to mime type (Server Action FormData can lose mime info)
                const mimeMap: Record<string, string> = {
                    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                    'png': 'image/png', 'gif': 'image/gif',
                    'webp': 'image/webp', 'svg': 'image/svg+xml',
                };
                const contentType = mimeMap[fileExt] || file.type || 'image/jpeg';

                // Convert File to ArrayBuffer for reliable server-side upload
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const { error: uploadError } = await supabase.storage
                    .from('evidence')
                    .upload(fileName, buffer, { contentType, upsert: false });

                if (uploadError) {
                    console.warn("Evidence upload error:", uploadError.message);
                } else {
                    const { data: publicData } = supabase.storage.from('evidence').getPublicUrl(fileName);
                    uploadedFileUrl = publicData.publicUrl;
                    console.log("Evidence uploaded successfully:", uploadedFileUrl);
                }
            } catch (err) {
                console.log("Failed to upload evidence to storage, continuing without it:", err);
            }
        }

        if (uploadedFileUrl) {
            insertPayload.evidence_url = uploadedFileUrl;
        }

        // --- SAFE RECURSIVE INSERT ENGINE ---
        // This will strip columns that don't exist in the DB schema cache dynamically
        const performSafeInsert = async (currentPayload: any, attempts: number = 0): Promise<any> => {
            if (attempts > 10) throw new Error("Too many missing columns in DB schema.");

            const { data, error } = await supabase.from("cases").insert(currentPayload).select();

            if (error) {
                // Check for PostgREST "Could not find the 'column' column" error (Code PGRST204)
                if (error.code === 'PGRST204' || error.message.includes("Could not find the")) {
                    const match = error.message.match(/'([^']+)' column/);
                    if (match && match[1]) {
                        const missingCol = match[1];
                        console.warn(`Safe-Insert: Column '${missingCol}' missing in DB cache. Stripping it and retrying...`);
                        
                        const nextPayload = { ...currentPayload };
                        delete nextPayload[missingCol];
                        
                        // If we've stripped everything but title, and it still fails, give up
                        if (Object.keys(nextPayload).length === 0) throw error;
                        
                        return performSafeInsert(nextPayload, attempts + 1);
                    }
                }
                throw error;
            }
            return data;
        };

        await performSafeInsert(insertPayload);

        // Success: Return mock case ID
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const newCaseId = `CS-IND-2026-${randomId}`;

        return { success: true, caseId: newCaseId };
    } catch (e: any) {
         console.error("Critical submission crash:", e);
         return { success: false, error: e?.message || "Internal Server Action crash." };
    }
}
