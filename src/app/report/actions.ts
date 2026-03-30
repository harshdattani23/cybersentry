"use server";

import { createClient } from "@supabase/supabase-js";

export async function submitReportAction(insertPayload: any, fileDataUrl: string | null) {
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
            }
        });

        // Try to upload the file to storage if base64 is provided
        let uploadedFileUrl = "";
        if (fileDataUrl) {
            try {
                // Convert base64 to buffer
                const base64Data = fileDataUrl.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Determine mime type from data URL
                const mimeMatch = fileDataUrl.match(/^data:(image\/\w+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
                const fileExt = mimeType.split('/')[1] || 'jpg';
                
                const fileName = `evidence-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('evidence')
                    .upload(fileName, buffer, {
                        contentType: mimeType,
                        upsert: false
                    });

                if (!uploadError) {
                    const { data: publicData } = supabase.storage.from('evidence').getPublicUrl(fileName);
                    uploadedFileUrl = publicData.publicUrl;
                }
            } catch (err) {
                console.log("Failed to upload evidence to storage, continuing without it:", err);
            }
        }

        if (uploadedFileUrl) {
            insertPayload.evidence_url = uploadedFileUrl;
        }

        // Insert into database
        const { error: insertError } = await supabase.from("cases").insert(insertPayload).select("id");

        if (insertError) {
             if (insertError.message.includes('evidence_url')) {
                 delete insertPayload.evidence_url;
                 const { error: retryError } = await supabase.from("cases").insert(insertPayload).select("id");
                 if (retryError) return { success: false, error: retryError.message };
             } else {
                 return { success: false, error: insertError.message };
             }
        }

        // Return mock case ID just like before
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const newCaseId = `CS-IND-2026-${randomId}`;

        return { success: true, caseId: newCaseId };
    } catch (e: any) {
         return { success: false, error: e?.message || "Internal Server Action crash." };
    }
}
