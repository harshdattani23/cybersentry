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

        // Parse standard fields
        const insertPayload: any = {
            title: formData.get('title') as string,
            category: formData.get('category') as string,
            platform: formData.get('platform') as string,
            description: formData.get('description') as string,
            phone: formData.get('phone') as string,
            url: formData.get('url') as string,
            status: 'under_review',
            is_public: true,
        };

        const file = formData.get('file') as File | null;
        let uploadedFileUrl = "";

        if (file && file.size > 0) {
            try {
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `evidence-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('evidence')
                    .upload(fileName, file, {
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
        const { error: insertError } = await supabase.from("cases").insert(insertPayload).select();

        if (insertError) {
             if (insertError.message.includes('evidence_url')) {
                 delete insertPayload.evidence_url;
                 const { error: retryError } = await supabase.from("cases").insert(insertPayload).select();
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
