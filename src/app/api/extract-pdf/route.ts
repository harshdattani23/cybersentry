import DOMMatrix from "@thednp/dommatrix";
(globalThis as any).DOMMatrix = DOMMatrix;

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

    // ── 2a. Upload PDF to Supabase Storage ─────────────────────────────
    let pdfUrl = "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey && supabaseServiceKey !== "your-supabase-service-role-key-here" && supabaseServiceKey.startsWith("eyJ")) {
      try {
        console.log("Step 2: Uploading to Supabase");
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

    // ── 3. Extract text from PDF (using pdfjs-dist, Node-compatible) ───
    let extractedText = "";
    try {
      console.log("Step 3: Importing pdfjs-dist");
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

      // Disable worker completely — run in main thread (Node.js safe)
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";

      console.log("Step 3a: pdfjs-dist loaded, extracting text");

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        disableWorker: true,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      } as any);
      const pdfDoc = await loadingTask.promise;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items
          .filter((item: any) => "str" in item)
          .map((item: any) => item.str);
        extractedText += strings.join(" ") + "\n\n";
      }

      console.log("Step 3b: Extracted", extractedText.length, "characters from", pdfDoc.numPages, "pages");
    } catch (pdfErr: any) {
      console.error("[extract-pdf] PDF parsing failed:", pdfErr);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse the PDF file: " + (pdfErr.message || "Unknown error"),
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not extract any text from the PDF." }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 4. Initialise Gemini ───────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "GEMINI_API_KEY is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ── 5. Build prompt ────────────────────────────────────────────────
    const prompt = `You are a structured-data extraction assistant.

Analyse the following text extracted from a PDF document and return a JSON object with EXACTLY these keys:

- "title"    : The title or heading of the document.
- "category" : The broad category or topic (e.g. "Cybersecurity", "Finance", "Technology").
- "summary"  : A concise 2-3 sentence summary of the document.
- "content"  : The main body / key content of the document (can be a longer string).
- "source"   : The source or publisher, if identifiable from the text. Use "Unknown" if not found.
- "author"   : The author name(s), if identifiable from the text. Use "Unknown" if not found.

Rules:
1. Return ONLY valid JSON — no markdown fences, no explanation, no extra text.
2. If a field cannot be determined, use "Unknown" as the value.

--- BEGIN EXTRACTED TEXT ---
${extractedText}
--- END EXTRACTED TEXT ---`;

    // ── 6. Generate structured response ────────────────────────────────
    console.log("Step 4: Calling Gemini");
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // ── 6a. Clean response — Gemini sometimes wraps JSON in markdown ──
    let cleanText = rawText.trim();

    // Remove markdown code fences (```json ... ``` or ``` ... ```)
    if (cleanText.startsWith("`")) {
      cleanText = cleanText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    }

    // Strip any stray text before the first `{` or after the last `}`
    const firstBrace = cleanText.indexOf("{");
    const lastBrace = cleanText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }

    // ── 6b. Safe JSON parse ────────────────────────────────────────────
    let parsed;
    try {
      console.log("Step 5: Parsing response");
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
        message: error.message || "Internal Server Error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
