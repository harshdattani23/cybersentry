import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // ── 0. Env Validation ─────────────────────────────────────────────
    console.log("ENV CHECK:", {
      gemini: !!process.env.GEMINI_API_KEY,
      supabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    });

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("Missing SUPABASE URL");
    }

    // ── 1. Get file from FormData ──────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file");
    console.log("Step 1: File received");

    if (!file || !(file instanceof Blob)) {
      return new Response(
        JSON.stringify({ success: false, error: "No PDF file provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 2. Convert to Buffer ───────────────────────────────────────────
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("Step 2: Buffer created, size:", buffer.length, "bytes");

    // ── 2a. Upload PDF to Supabase Storage ─────────────────────────────
    let pdfUrl = "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey && supabaseServiceKey !== "your-supabase-service-role-key-here" && supabaseServiceKey.startsWith("eyJ")) {
      try {
        console.log("Step 2a: Uploading to Supabase");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const originalName = file instanceof File ? file.name : "document.pdf";
        const fileType = file instanceof File ? file.type : "application/pdf";
        
        console.log("Uploading file:", originalName);
        
        const fileName = `pdf-${Date.now()}-${originalName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("pdf-uploads")
          .upload(fileName, buffer, {
            contentType: fileType,
          });

        console.log("Upload result:", uploadData, uploadError);

        if (uploadError) {
          // Storage upload is non-fatal — log and continue with extraction
          console.warn("[extract-pdf] PDF storage upload failed (non-fatal):", uploadError.message);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("pdf-uploads")
            .getPublicUrl(fileName);

          pdfUrl = publicUrlData.publicUrl;
        }
      } catch (storageErr) {
        console.warn("[extract-pdf] PDF storage upload error (non-fatal):", storageErr);
      }
    }

    // ── 3. Convert PDF to base64 for Gemini ────────────────────────────
    const base64 = buffer.toString("base64");
    console.log("Step 3: PDF converted to base64, length:", base64.length);

    // ── 4. Initialise Gemini ───────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "GEMINI_API_KEY is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    // ── 5. Send PDF directly to Gemini ─────────────────────────────────
    console.log("Step 4: Calling Gemini with PDF inline data");

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64,
        },
      },
      `Extract and structure this cyber fraud news article into JSON.

Return a JSON object with EXACTLY these keys:

{
  "title": "",
  "category": "",
  "summary": "",
  "content": "",
  "source": "",
  "author": ""
}

Rules:
1. Clean formatting with proper sentences
2. Infer category from content (e.g. "Cybersecurity", "UPI Fraud", "Banking Fraud", "AI Fraud", "Policy Update", "Cyber Advisory", "Emerging Scam")
3. Keep content readable and well-structured
4. No markdown formatting in values
5. If a field cannot be determined, use "Unknown"
6. Return ONLY valid JSON — no markdown fences, no explanation, no extra text`,
    ]);

    const rawText = result.response.text();
    console.log("Step 5: Gemini response received, length:", rawText.length);

    // ── 6. Clean & parse response ──────────────────────────────────────
    let cleanText = rawText.trim();

    // Remove markdown code fences (```json ... ``` or ``` ... ```)
    cleanText = cleanText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    // Strip any stray text before the first `{` or after the last `}`
    const firstBrace = cleanText.indexOf("{");
    const lastBrace = cleanText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      console.log("Step 6: Parsing Gemini response");
      parsed = JSON.parse(cleanText);
    } catch {
      console.error("[extract-pdf] Failed to parse AI response:", cleanText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid AI response — could not parse structured data.",
          raw: cleanText,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 7. Return structured data ──────────────────────────────────────
    console.log("Step 7: Returning parsed data successfully");
    return new Response(
      JSON.stringify({
        success: true,
        data: parsed,
        pdfUrl: pdfUrl,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("API ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal Server Error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
