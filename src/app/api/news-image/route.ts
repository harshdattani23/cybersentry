import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { extractFirstImageFromHtml } from "@/lib/extractImage";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("news")
    .select("image_url, content")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let finalUrl = data.image_url;

  if (!finalUrl && data.content) {
      finalUrl = extractFirstImageFromHtml(data.content);
  }

  if (!finalUrl) {
      return NextResponse.json({ error: "No image found" }, { status: 404 });
  }

  const base64Match = finalUrl.match(
    /^data:(image\/\w+);base64,(.+)$/
  );

  if (!base64Match) {
    // It's a regular URL — redirect to it
    return NextResponse.redirect(data.image_url);
  }

  const contentType = base64Match[1];
  const buffer = Buffer.from(base64Match[2], "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
