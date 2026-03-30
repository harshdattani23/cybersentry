-- ================================================================
-- CyberSentry: Evidence Storage Bucket Setup
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ================================================================

-- Update the evidence bucket to allow more image formats
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'image/bmp', 'image/tiff', 'application/octet-stream'
]
WHERE id = 'evidence';

-- If bucket doesn't exist yet, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'evidence',
    'evidence',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Drop and recreate storage policies to ensure they exist
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;

CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "Allow public downloads" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'evidence');
