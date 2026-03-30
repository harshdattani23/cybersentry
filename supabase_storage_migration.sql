-- ================================================================
-- CyberSentry: Evidence Storage Bucket Setup
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates the storage bucket needed for evidence file uploads
-- ================================================================

-- Create the evidence storage bucket (public, so images can be displayed)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'evidence',
    'evidence',
    true,
    10485760,  -- 10MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload evidence files
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'evidence');

-- Allow anyone to view/download evidence files  
CREATE POLICY "Allow public downloads" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'evidence');
