/**
 * Extracts the first image URL (src) from an HTML string.
 * Works with both base64 data URIs (from Quill paste) and regular URLs.
 * Returns null if no image is found.
 */
export function extractFirstImageFromHtml(html: string | null | undefined): string | null {
  if (!html) return null;

  // Match the first <img> tag's src attribute
  const imgMatch = html.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

/**
 * Extracts ALL image URLs (src) from an HTML string.
 * Returns an array of image source strings. Empty array if none found.
 */
export function extractAllImagesFromHtml(html: string | null | undefined): string[] {
  if (!html) return [];

  const regex = /<img[^>]+src\s*=\s*["']([^"']+)["']/gi;
  const images: string[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    images.push(match[1]);
  }

  return images;
}

/**
 * Collects all unique card images: featured image (image_url) first,
 * then any images embedded in the article content HTML.
 */
export function collectCardImages(imageUrl: string | null | undefined, contentHtml: string | null | undefined): string[] {
  const images: string[] = [];

  // Add featured image first if it exists
  if (imageUrl && imageUrl.trim() !== '') {
    images.push(imageUrl);
  }

  // Add all content-embedded images
  const contentImages = extractAllImagesFromHtml(contentHtml);
  for (const img of contentImages) {
    // Avoid duplicates
    if (!images.includes(img)) {
      images.push(img);
    }
  }

  return images;
}
